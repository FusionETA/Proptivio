export default function UnitCard({ unit }) {
    const getStatusBadge = (status) => {
        const colors = {
            Available: 'bg-green-100 text-green-800',
            Reserved: 'bg-yellow-100 text-yellow-800',
            Sold: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(unit.status)}`}>
                    {unit.status}
                </span>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{unit.level}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{unit.type}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{unit.sqft} sqft</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">View:</span>
                    <span className="font-medium capitalize">{unit.viewOrientation}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-lg">
                        {unit.currency} {Number(unit.price).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
