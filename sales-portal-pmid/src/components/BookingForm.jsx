import { useState, useEffect } from 'react';


const InputField = ({ label, name, type = 'text', value, onChange, error, ...props }) => (
    <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={`
                block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 
                transition duration-200
                focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 
                ${error ? 'bg-red-50 ring-1 ring-red-500' : 'hover:bg-gray-100'}
            `}
            {...props}
        />
        {error && (
            <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
        )}
    </div>
);

const FileUploadField = ({ label, name, onChange, error, fileName }) => (
    <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
            {label}
        </label>
        <div className="relative">
            <input
                type="file"
                name={name}
                onChange={onChange}
                accept="image/*,.pdf"
                className="hidden"
                id={`file-${name}`}
            />
            <label
                htmlFor={`file-${name}`}
                className={`
                    flex items-center gap-3 w-full rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium
                    cursor-pointer transition duration-200
                    ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
                `}
            >
                {fileName ? (
                    <>
                        <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-900 truncate">{fileName}</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-400">Click to upload file</span>
                    </>
                )}
            </label>
        </div>
        {error && (
            <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
        )}
    </div>
);



export default function BookingForm({ selectedUnits, onSubmit, onClose, loading }) {
    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientIC: '',
        clientAddress: '',
        clientCountry: '',
        clientNationality: '',
        bookingPaymentMode: '',
        bookingFeeAmount: '',
        paymentRefNo: '',
        applicationFee: '',
        paymentDate: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});
    const [paymentModeOptions, setPaymentModeOptions] = useState([]);
    const [nationalityOptions, setNationalityOptions] = useState([]);

    // Fetch dropdown options from Bitrix24 dynamically
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [paymentRes, nationalityRes] = await Promise.all([
                    fetch('/api/payment-modes'),
                    fetch('/api/nationalities')
                ]);
                const paymentData = await paymentRes.json();
                const nationalityData = await nationalityRes.json();

                if (paymentData.success) setPaymentModeOptions(paymentData.options);
                if (nationalityData.success) setNationalityOptions(nationalityData.options);
            } catch (err) {
                console.error('Failed to fetch dropdown options:', err);
            }
        };
        fetchOptions();
    }, []);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [files, setFiles] = useState({
        passportIC: null,
        paymentReceipt: null
    });
    const [fileNames, setFileNames] = useState({
        passportIC: '',
        paymentReceipt: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        const file = fileList[0];
        if (!file) return;

        // Read file as base64
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:...;base64, prefix
            setFiles(prev => ({ ...prev, [name]: { base64, fileName: file.name } }));
            setFileNames(prev => ({ ...prev, [name]: file.name }));
        };
        reader.readAsDataURL(file);

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
        if (!formData.clientEmail.trim()) {
            newErrors.clientEmail = 'Client email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.clientEmail)) {
            newErrors.clientEmail = 'Email is invalid';
        }
        if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Client phone is required';
        if (!formData.clientIC.trim()) newErrors.clientIC = 'IC / Passport No is required';
        if (!formData.clientAddress.trim()) newErrors.clientAddress = 'Address is required';
        if (!formData.clientCountry.trim()) newErrors.clientCountry = 'Country is required';
        if (!formData.clientNationality) newErrors.clientNationality = 'Nationality is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirmation(true);
        }
    };

    const handleFinalSubmit = () => {
        onSubmit({ ...formData, files });
    };

    const totalPrice = selectedUnits.reduce((sum, unit) =>
        sum + (parseFloat(unit.price) || 0), 0
    );

    const getFormattedView = (orientation, position) => {
        if (!position) return orientation;
        const normOrientation = orientation?.toLowerCase().trim();
        const normPosition = position?.toLowerCase().trim();

        // If position already contains orientation, just show position
        if (normPosition.includes(normOrientation)) {
            return position;
        }
        return `${orientation} | ${position}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel: Summary */}
                <div className="w-full md:w-5/12 bg-gray-50 border-r border-gray-100 p-8 overflow-y-auto">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>

                    <div className="space-y-4 mb-8">
                        {selectedUnits.map(unit => {
                            const isRetail = unit.unitCategory === 'retail';
                            const isPantaiRemis = unit.unitCategory === 'pantairemis';
                            const borderColor = isRetail ? 'border-teal-200' : isPantaiRemis ? 'border-orange-200' : 'border-gray-100';
                            return (
                                <div key={unit.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${borderColor} mb-4`}>
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <div className="flex-1">
                                            <span className="text-xl font-extrabold text-gray-900 break-words">{unit.name}</span>
                                            {isRetail && (
                                                <span className="ml-2 text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded">
                                                    RETAIL
                                                </span>
                                            )}
                                            {isPantaiRemis && (
                                                <span className="ml-2 text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                    PANTAI REMIS
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                                            RM {Number(unit.price).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            {unit.level && (
                                                <span className={`${isRetail ? 'bg-teal-100 text-teal-700' : isPantaiRemis ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded text-xs font-bold uppercase tracking-wide`}>
                                                    Level {unit.level}
                                                </span>
                                            )}
                                            <span className={`${isRetail ? 'bg-teal-100 text-teal-700' : isPantaiRemis ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded text-xs font-bold uppercase tracking-wide`}>
                                                {unit.type}
                                            </span>
                                        </div>

                                        {isPantaiRemis ? (
                                            // Pantai Remis fields
                                            <>
                                                {unit.size && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                                        {unit.size}
                                                    </div>
                                                )}
                                            </>
                                        ) : isRetail ? (
                                            // Retail-specific fields
                                            <>
                                                {unit.sqft && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                                        {unit.sqft} sqft
                                                        {unit.sqm && ` (${unit.sqm} sqm)`}
                                                    </div>
                                                )}
                                                {unit.size && (
                                                    <div className="text-gray-500">
                                                        <span className="font-semibold">Size:</span> {unit.size}
                                                    </div>
                                                )}
                                                {unit.area && (
                                                    <div className="text-gray-500">
                                                        <span className="font-semibold">Area:</span> {unit.area}
                                                    </div>
                                                )}
                                                {unit.areaRm && (
                                                    <div className="text-gray-500">
                                                        <span className="font-semibold">Area (RM):</span> RM {Number(unit.areaRm).toLocaleString()}
                                                    </div>
                                                )}
                                                {(unit.psf || unit.psm) && (
                                                    <div className="text-gray-500 text-xs">
                                                        {unit.psf && <span>PSF: RM {Number(unit.psf).toLocaleString()}</span>}
                                                        {unit.psf && unit.psm && <span className="mx-1">•</span>}
                                                        {unit.psm && <span>PSM: RM {Number(unit.psm).toLocaleString()}</span>}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            // SOHO fields
                                            <>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                                    {unit.sqft} sqft
                                                </div>
                                                <div className="flex items-start gap-2 text-gray-500">
                                                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    <span className="leading-snug break-words">
                                                        {getFormattedView(unit.viewOrientation, unit.viewPosition)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-sm text-gray-500">Total Units</span>
                            <span className="font-medium text-gray-900">{selectedUnits.length}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-500">Total Price</span>
                            <span className="text-2xl font-bold text-gray-900">
                                RM {totalPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-7/12 flex flex-col min-h-0 bg-white">
                    {showConfirmation ? (
                        /* ── Confirmation View ── */
                        <>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Review Booking Details</h2>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <p className="text-sm text-gray-500 mb-6">Please review the client details below before submitting.</p>

                                <div className="space-y-4">
                                    {[
                                        { label: 'Full Name', value: formData.clientName },
                                        { label: 'Email Address', value: formData.clientEmail },
                                        { label: 'Phone Number', value: formData.clientPhone },
                                        { label: 'IC / Passport No', value: formData.clientIC },
                                        { label: 'Residential Address', value: formData.clientAddress },
                                        { label: 'Country', value: formData.clientCountry },
                                        { label: 'Nationality', value: nationalityOptions.find(o => o.id === formData.clientNationality)?.label || formData.clientNationality },
                                        ...(formData.bookingPaymentMode ? [{ label: 'Booking Payment Mode', value: paymentModeOptions.find(o => o.id === formData.bookingPaymentMode)?.label || formData.bookingPaymentMode }] : []),
                                        ...(formData.bookingFeeAmount ? [{ label: 'Booking Fee Amount', value: `RM ${Number(formData.bookingFeeAmount).toLocaleString()}` }] : []),
                                        ...(formData.paymentRefNo ? [{ label: 'Payment Ref No.', value: formData.paymentRefNo }] : []),
                                        ...(formData.applicationFee ? [{ label: 'Application Fee', value: `RM ${Number(formData.applicationFee).toLocaleString()}` }] : []),
                                        ...(formData.paymentDate ? [{ label: 'Payment Date', value: formData.paymentDate }] : []),
                                        ...(formData.remarks ? [{ label: 'Remarks', value: formData.remarks }] : []),
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                                            <p className="text-sm font-semibold text-gray-900">{value}</p>
                                        </div>
                                    ))}

                                    {/* Attached Files */}
                                    {[
                                        { label: 'Passport / IC', fileName: fileNames.passportIC },
                                        { label: 'Payment Deposit Slip', fileName: fileNames.paymentReceipt },
                                    ].map(({ label, fileName }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white">
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmation(false)}
                                        disabled={loading}
                                        className="flex-1 px-6 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        disabled={loading}
                                        className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Submit Booking</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ── Form View ── */
                        <>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Client Details</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Full Name"
                                            name="clientName"
                                            placeholder="e.g. John Doe"
                                            value={formData.clientName}
                                            onChange={handleChange}
                                            error={errors.clientName}
                                        />
                                        <InputField
                                            label="Email Address"
                                            name="clientEmail"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.clientEmail}
                                            onChange={handleChange}
                                            error={errors.clientEmail}
                                        />
                                        <InputField
                                            label="Phone Number"
                                            name="clientPhone"
                                            type="tel"
                                            placeholder="+60 12 345 6789"
                                            value={formData.clientPhone}
                                            onChange={handleChange}
                                            error={errors.clientPhone}
                                        />
                                        <InputField
                                            label="IC / Passport No"
                                            name="clientIC"
                                            placeholder="Identification Number"
                                            value={formData.clientIC}
                                            onChange={handleChange}
                                            error={errors.clientIC}
                                        />
                                    </div>

                                    <InputField
                                        label="Residential Address"
                                        name="clientAddress"
                                        value={formData.clientAddress}
                                        onChange={handleChange}
                                        error={errors.clientAddress}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Country"
                                            name="clientCountry"
                                            placeholder="e.g. Malaysia"
                                            value={formData.clientCountry}
                                            onChange={handleChange}
                                            error={errors.clientCountry}
                                        />
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                                Nationality
                                            </label>
                                            <select
                                                name="clientNationality"
                                                value={formData.clientNationality}
                                                onChange={handleChange}
                                                className={`
                                                    block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900
                                                    transition duration-200 cursor-pointer
                                                    focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900
                                                    ${errors.clientNationality ? 'bg-red-50 ring-1 ring-red-500' : 'hover:bg-gray-100'}
                                                `}
                                            >
                                                <option value="">Select Nationality</option>
                                                {nationalityOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {errors.clientNationality && (
                                                <p className="mt-1 text-xs text-red-500 font-medium">{errors.clientNationality}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Booking Payment Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                                Booking Payment Mode
                                            </label>
                                            <select
                                                name="bookingPaymentMode"
                                                value={formData.bookingPaymentMode}
                                                onChange={handleChange}
                                                className={`
                                                    block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900
                                                    transition duration-200 cursor-pointer
                                                    focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900
                                                    ${errors.bookingPaymentMode ? 'bg-red-50 ring-1 ring-red-500' : 'hover:bg-gray-100'}
                                                `}
                                            >
                                                <option value="">Select Payment Mode</option>
                                                {paymentModeOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {errors.bookingPaymentMode && (
                                                <p className="mt-1 text-xs text-red-500 font-medium">{errors.bookingPaymentMode}</p>
                                            )}
                                        </div>
                                        <InputField
                                            label="Booking Fee Amount"
                                            name="bookingFeeAmount"
                                            type="text"
                                            placeholder="e.g. 10000"
                                            value={formData.bookingFeeAmount}
                                            onChange={handleChange}
                                            error={errors.bookingFeeAmount}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Payment Ref No."
                                            name="paymentRefNo"
                                            placeholder="e.g. TXN123456"
                                            value={formData.paymentRefNo}
                                            onChange={handleChange}
                                            error={errors.paymentRefNo}
                                        />
                                        <InputField
                                            label="Application Fee"
                                            name="applicationFee"
                                            type="text"
                                            placeholder="e.g. 1000"
                                            value={formData.applicationFee}
                                            onChange={handleChange}
                                            error={errors.applicationFee}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Payment Date"
                                            name="paymentDate"
                                            type="date"
                                            value={formData.paymentDate}
                                            onChange={handleChange}
                                            error={errors.paymentDate}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                                            Remarks
                                        </label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Any additional remarks..."
                                            className="block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition duration-200 focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 hover:bg-gray-100 resize-none"
                                        />
                                    </div>

                                    {/* File Upload Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FileUploadField
                                            label="Passport / IC"
                                            name="passportIC"
                                            onChange={handleFileChange}
                                            error={errors.passportIC}
                                            fileName={fileNames.passportIC}
                                        />
                                        <FileUploadField
                                            label="Payment Deposit Slip"
                                            name="paymentReceipt"
                                            onChange={handleFileChange}
                                            error={errors.paymentReceipt}
                                            fileName={fileNames.paymentReceipt}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white">
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 px-6 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="booking-form"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <span>Confirm Booking</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
