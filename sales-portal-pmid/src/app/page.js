'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UnitGrid from '@/components/UnitGrid';
import OverviewDashboard from '@/components/OverviewDashboard';
import BookingForm from '@/components/BookingForm';
import OTPFormViewer from '@/components/OTPFormViewer';
import UserProfile from '@/components/UserProfile';
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [units, setUnits] = useState({});
    const [allUnits, setAllUnits] = useState([]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [sohoExpanded, setSohoExpanded] = useState(true);
    const [sohoActiveView, setSohoActiveView] = useState('general');
    const [pantaiRemisActiveView, setPantaiRemisActiveView] = useState('');
    const [otpData, setOtpData] = useState(null); // { dealId, contactId } — shown after booking success

    useEffect(() => {
        loadUnits();
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const loadUnits = async () => {
        setLoading(true);
        try {
            // Add timestamp to prevent caching
            const response = await fetch(`/sales/api/units?_=${Date.now()}`);
            const data = await response.json();

            if (data.success) {
                const grouped = groupUnitsByView(data.units);
                setUnits(grouped);
                setAllUnits(data.units);
            } else {
                toast.error('Failed to load units');
            }
        } catch (error) {
            toast.error('Error loading units: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const groupUnitsByView = (unitsList) => {
        const grouped = {};
        if (!unitsList || unitsList.length === 0) return {};

        unitsList.forEach(u => {
            // Retail units go to their own category
            if (u.unitCategory === 'retail' || u.viewOrientation === 'retail') {
                if (!grouped['retail']) {
                    grouped['retail'] = [];
                }
                grouped['retail'].push(u);
            } else if (u.unitCategory === 'pantairemis') {
                // Pantai Remis units grouped by type (with 'pr_' prefix to avoid key collisions)
                const typeKey = `pr_${u.type || 'Other'}`;
                if (!grouped[typeKey]) {
                    grouped[typeKey] = [];
                }
                grouped[typeKey].push(u);
            } else {
                // SOHO units grouped by view orientation ('general' = all units, 'other' excluded)
                const orientation = u.viewOrientation || 'general';
                if (orientation !== 'other') {
                    if (!grouped[orientation]) {
                        grouped[orientation] = [];
                    }
                    grouped[orientation].push(u);
                }
            }
        });
        return grouped;
    };

    const toggleUnitSelection = (unit) => {
        if (unit.status !== 'Available') return;

        setSelectedUnits(prev => {
            const exists = prev.find(u => u.id === unit.id);
            if (exists) {
                return prev.filter(u => u.id !== unit.id);
            } else {
                return [...prev, unit];
            }
        });
    };

    const handleBooking = () => {
        if (selectedUnits.length === 0) {
            toast.error('Please select at least one unit');
            return;
        }
        setShowBookingForm(true);
    };

    const handleBookingSubmit = async (bookingData) => {
        setLoading(true);
        try {
            const response = await fetch('/sales/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingData,
                    unitIds: selectedUnits.map(u => u.id),
                    assignedById: user?.id // Pass logged-in user ID
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`Successfully booked ${result.summary.successful} unit(s)`);
                setSelectedUnits([]);
                setShowBookingForm(false);
                loadUnits(); // Refresh

                // If we have dealId and contactId, show OTP form for signing
                if (result.dealId && result.contactId) {
                    setOtpData({
                        dealId: result.dealId,
                        contactId: result.contactId,
                        unitDetailsList: result.unitDetailsList || []
                    });
                }
            } else {
                toast.error(result.error || 'Booking failed');
            }
        } catch (error) {
            toast.error('Error creating booking: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedUnits([]);
    };

    const handleOTPClose = () => {
        setOtpData(null);
        loadUnits(); // Refresh units after OTP flow
    };

    // Helper to format tab name
    const formatViewName = (name) => {
        if (name === 'general') return 'All Units';
        if (name === 'southeast') return 'Southeast View';
        if (name === 'northwest') return 'Northwest View';
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const totalPrice = selectedUnits.reduce((sum, u) => sum + (parseFloat(u.price) || 0), 0);

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen pb-32 font-sans text-gray-900">
            <Toaster position="top-right" toastOptions={{
                className: 'rounded-xl shadow-lg border border-gray-100',
                style: { background: '#1f2937', color: '#fff' }
            }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                            Sales Portal
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Manage bookings and view unit availability instantly.
                        </p>
                    </div>
                    {/* User Profile */}
                    <UserProfile />
                </div>

                {/* Main Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-1">
                    <nav className="flex space-x-1 overflow-x-auto p-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'overview'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('soho');
                                setSohoExpanded(true);
                            }}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'soho'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            ABC Soho {units.general && <span className="ml-1 opacity-70 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{units.general.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('retail')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'retail'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Retail {units.retail && <span className="ml-1 opacity-70 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{units.retail.length}</span>}
                        </button>
                    </nav>
                </div>

                {/* SOHO Collapsible View Selector */}
                {activeTab === 'soho' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
                        <div className="flex items-center gap-4 overflow-x-auto">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">View:</span>
                            {Object.keys(units).filter(key => key !== 'retail' && !key.startsWith('pr_')).map(viewName => (
                                <button
                                    key={viewName}
                                    onClick={() => setSohoActiveView(viewName)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${sohoActiveView === viewName
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {formatViewName(viewName)} <span className="ml-1 opacity-70 text-xs">{units[viewName]?.length || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pantai Remis Type Selector */}
                {activeTab === 'pantairemis' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
                        <div className="flex items-center gap-4 overflow-x-auto">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Type:</span>
                            {Object.keys(units).filter(key => key.startsWith('pr_')).map(typeKey => (
                                <button
                                    key={typeKey}
                                    onClick={() => setPantaiRemisActiveView(typeKey)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${pantaiRemisActiveView === typeKey
                                        ? 'bg-orange-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {typeKey.replace('pr_', '')} <span className="ml-1 opacity-70 text-xs">{units[typeKey]?.length || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' ? (
                        <OverviewDashboard
                            units={allUnits}
                            loading={loading}
                            onRefresh={loadUnits}
                        />
                    ) : activeTab === 'soho' ? (
                        <>
                            {loading && Object.keys(units).length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                                    <p className="mt-4 text-gray-500 font-medium">Loading units...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <UnitGrid
                                        units={units[sohoActiveView] || []}
                                        selectedUnits={selectedUnits}
                                        onUnitClick={toggleUnitSelection}
                                    />
                                </div>
                            )}
                        </>
                    ) : activeTab === 'retail' ? (
                        <>
                            {loading && Object.keys(units).length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                                    <p className="mt-4 text-gray-500 font-medium">Loading units...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <UnitGrid
                                        units={units.retail || []}
                                        selectedUnits={selectedUnits}
                                        onUnitClick={toggleUnitSelection}
                                    />
                                </div>
                            )}
                        </>
                    ) : activeTab === 'pantairemis' ? (
                        <>
                            {loading && Object.keys(units).filter(k => k.startsWith('pr_')).length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                                    <p className="mt-4 text-gray-500 font-medium">Loading units...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <UnitGrid
                                        units={units[pantaiRemisActiveView] || []}
                                        selectedUnits={selectedUnits}
                                        onUnitClick={toggleUnitSelection}
                                        showFloorHeader={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : null}
                </div>


                {/* Sticky Selection Bar */}
                {selectedUnits.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 z-40 animate-in slide-in-from-bottom duration-300">
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center justify-between ring-1 ring-black/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                                    {selectedUnits.length} Selected
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Value</p>
                                    <p className="font-bold text-gray-900">RM {totalPrice.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={clearSelection}
                                    className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleBooking}
                                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    <span>Book Now</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Form Modal */}
                {showBookingForm && (
                    <BookingForm
                        selectedUnits={selectedUnits}
                        onSubmit={handleBookingSubmit}
                        onClose={() => setShowBookingForm(false)}
                        loading={loading}
                    />
                )}

                {/* OTP Form Viewer Modal — shown after successful booking */}
                {otpData && (
                    <OTPFormViewer
                        dealId={otpData.dealId}
                        contactId={otpData.contactId}
                        unitDetailsList={otpData.unitDetailsList}
                        onClose={handleOTPClose}
                    />
                )}
            </div>
        </div >
    );
}
