import RetailUnitCard from './RetailUnitCard';

export default function UnitGrid({ units, selectedUnits, onUnitClick, showFloorHeader = true }) {
    const isSelected = (unit) => {
        return selectedUnits.some(u => u.id === unit.id);
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-500';
        switch (status.toLowerCase()) {
            case 'available':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'booking':
                return 'bg-green-500 cursor-not-allowed';
            case 'hold':
                return 'bg-amber-500 cursor-not-allowed';
            case 'sold':
                return 'bg-red-500 cursor-not-allowed';
            default:
                return 'bg-gray-500';
        }
    };

    // Group by floor
    const groupedByFloor = units.reduce((acc, unit) => {
        const floor = unit.level || 'Unknown';
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(unit);
        return acc;
    }, {});

    const sortedFloors = Object.keys(groupedByFloor).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numB - numA; // Descending order for numbers
        }
        return String(b).localeCompare(String(a)); // Descending order for strings
    });

    // Check if these are retail units
    const isRetailUnits = units.length > 0 && units[0].unitCategory === 'retail';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Legend - Moved to Top */}
            <div className="mb-8 pb-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-8 text-base font-medium text-gray-600">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-full shadow-sm"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
                        <span>Booking</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
                        <span>Hold</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm"></div>
                        <span>Sold</span>
                    </div>
                </div>
            </div>

            {sortedFloors.map(floor => (
                <div key={floor} className="mb-8 last:mb-0">
                    {showFloorHeader && (
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Floor {floor}
                        </h3>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {groupedByFloor[floor].map(unit => (
                            <RetailUnitCard
                                key={unit.id}
                                unit={unit}
                                isSelected={isSelected(unit)}
                                onClick={onUnitClick}
                            />
                        ))}
                    </div>
                </div>
            ))}


        </div>
    );
}
