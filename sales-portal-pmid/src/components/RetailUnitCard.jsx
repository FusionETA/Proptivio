/**
 * RetailUnitCard Component
 * Displays retail-specific unit information
 */
export default function RetailUnitCard({ unit, isSelected, onClick }) {
    const getStatusConfig = (status) => {
        const configs = {
            'Available': {
                bgClass: isSelected
                    ? 'bg-[#334E68] text-white shadow-xl scale-105 ring-4 ring-offset-2 ring-[#334E68]/50 z-10'  // Deep Slate Blue
                    : 'bg-white/80 backdrop-blur-md hover:bg-white/95 hover:shadow-lg border border-white/60 text-slate-800 shadow-sm', // Glassy
                badgeClass: 'bg-slate-100 text-slate-700',
                clickable: true
            },
            'Booking': {
                bgClass: 'bg-emerald-50/90 border border-emerald-100 text-emerald-800 cursor-not-allowed shadow-none',
                badgeClass: 'bg-emerald-100 text-emerald-800',
                clickable: false
            },
            'Hold': {
                bgClass: 'bg-amber-50/90 border border-amber-100 text-amber-800 cursor-not-allowed shadow-none',
                badgeClass: 'bg-amber-100 text-amber-800',
                clickable: false
            },
            'Sold': {
                bgClass: 'bg-rose-50/80 border border-rose-100 text-rose-800 opacity-70 cursor-not-allowed shadow-none',
                badgeClass: 'bg-rose-100 text-rose-800',
                clickable: false
            }
        };
        return configs[status] || configs['Available'];
    };

    const statusConfig = getStatusConfig(unit.status);

    return (
        <button
            onClick={() => statusConfig.clickable && onClick(unit)}
            disabled={!statusConfig.clickable}
            className={`
                relative p-6 rounded-2xl text-left transition-all duration-300 group
                flex flex-col justify-between min-h-[180px] w-full
                ${statusConfig.bgClass}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className={`font-extrabold text-lg tracking-tight mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {unit.name}
                    </h3>
                    {unit.type && (
                        <span className={`text-xs font-semibold ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                            Type {unit.type}
                        </span>
                    )}
                </div>
                {isSelected && statusConfig.clickable && (
                    <span className="bg-white text-[#334E68] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm ml-2">
                        ✓
                    </span>
                )}
            </div>

            {/* Unit specs */}
            {(unit.sqft || (unit.bedrooms && unit.bedrooms !== '0') || (unit.bathrooms && unit.bathrooms !== '0')) && (
                <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {unit.sqft && (
                        <span><span className={`font-semibold uppercase tracking-wide ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>Sqft</span> <span className="font-bold">{unit.sqft}</span></span>
                    )}
                    {unit.bedrooms && unit.bedrooms !== '0' && (
                        <span><span className={`font-semibold uppercase tracking-wide ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>Bed</span> <span className="font-bold">{unit.bedrooms}</span></span>
                    )}
                    {unit.bathrooms && unit.bathrooms !== '0' && (
                        <span><span className={`font-semibold uppercase tracking-wide ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>Bath</span> <span className="font-bold">{unit.bathrooms}</span></span>
                    )}
                </div>
            )}

            {/* Pricing info */}
            {unit.psf && (
                <div className={`text-xs mb-2 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    <span className="font-semibold">PSF:</span>
                    <span className="ml-1 font-bold">RM {Number(unit.psf).toLocaleString()}</span>
                    {unit.psm && (
                        <>
                            <span className="mx-1">•</span>
                            <span className="font-semibold">PSM:</span>
                            <span className="ml-1 font-bold">RM {Number(unit.psm).toLocaleString()}</span>
                        </>
                    )}
                </div>
            )}

            {/* Price */}
            {statusConfig.clickable && unit.price && (
                <div className="pt-2 border-t border-current border-opacity-20">
                    <div className={`text-base font-extrabold ${isSelected ? 'text-white' : 'text-[#334E68]'}`}>
                        RM {Number(unit.price).toLocaleString()}
                    </div>
                </div>
            )}

            {/* Status badge for non-available units */}
            {!statusConfig.clickable && (
                <div className="mt-2">
                    <span className={`text-xs uppercase tracking-wider font-extrabold py-1 px-2 rounded-md ${statusConfig.badgeClass} inline-block`}>
                        {unit.status}
                    </span>
                </div>
            )}
        </button>
    );
}
