import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    city: '',
    state: '',
    min_bedrooms: '',
    property_type: '',
    investment_type: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${backendUrl}/api/properties?${queryParams}`);
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes('Good')) return 'text-green-600 bg-green-100';
    if (recommendation.includes('Review')) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const PropertyCard = ({ property }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={property.image_url} 
          alt={property.address}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(property.investment_recommendation || 'Review Required')}`}>
            {property.investment_recommendation || 'Review Required'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.address}</h3>
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(property.price)}</span>
          <span className="text-sm text-gray-600">{property.bedrooms} bed • {property.bathrooms} bath</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Estimated Rent</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(property.estimated_rent)}/mo</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">ARV</p>
            <p className="text-lg font-semibold text-purple-600">{formatCurrency(property.estimated_arv)}</p>
          </div>
        </div>

        {property.flip_analysis && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Flip Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">70% Rule:</span>
                <span className={`ml-2 ${property.flip_analysis.meets_70_rule ? 'text-green-600' : 'text-red-600'}`}>
                  {property.flip_analysis.meets_70_rule ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Est. ROI:</span>
                <span className="ml-2 font-semibold">{property.flip_analysis.estimated_roi}%</span>
              </div>
            </div>
          </div>
        )}

        {property.rental_analysis && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Rental Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">1% Rule:</span>
                <span className={`ml-2 ${property.rental_analysis.meets_1_percent_rule ? 'text-green-600' : 'text-red-600'}`}>
                  {property.rental_analysis.meets_1_percent_rule ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cash Flow:</span>
                <span className="ml-2 font-semibold">{formatCurrency(property.rental_analysis.monthly_cash_flow)}/mo</span>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setSelectedProperty(property)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const PropertyModal = ({ property, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{property.address}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={property.image_url} 
                alt={property.address}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              
              <div className="space-y-2">
                <p><strong>Price:</strong> {formatCurrency(property.price)}</p>
                <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                <p><strong>Square Feet:</strong> {property.sqft.toLocaleString()}</p>
                <p><strong>Year Built:</strong> {property.year_built}</p>
                <p><strong>Property Type:</strong> {property.property_type}</p>
                <p><strong>Days on Market:</strong> {property.days_on_market}</p>
                <p><strong>Neighborhood:</strong> {property.neighborhood_quality}</p>
              </div>
            </div>
            
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Flip Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Purchase Price</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.purchase_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ARV</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.arv || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Repair Costs</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.repair_cost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Purchase (70%)</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.max_purchase_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated ROI</p>
                      <p className="font-semibold text-green-600">{property.flip_analysis?.estimated_roi || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.net_profit || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-center p-2 rounded ${property.flip_analysis?.meets_70_rule ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {property.flip_analysis?.meets_70_rule ? '✓ Meets 70% Rule' : '✗ Fails 70% Rule'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Rental Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Rent</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_rent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">1% Threshold</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.one_percent_threshold || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Expenses</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_expenses || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash Flow</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_cash_flow || 0)}/mo</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cap Rate</p>
                      <p className="font-semibold text-blue-600">{property.rental_analysis?.cap_rate || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash-on-Cash Return</p>
                      <p className="font-semibold">{property.rental_analysis?.cash_on_cash_return || 0}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-center p-2 rounded ${property.rental_analysis?.meets_1_percent_rule ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {property.rental_analysis?.meets_1_percent_rule ? '✓ Meets 1% Rule' : '✗ Fails 1% Rule'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Real Estate Investment Sourcing</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Finding properties for flips & rentals</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Search Properties</h2>
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., Atlanta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., GA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
              <select
                name="min_bedrooms"
                value={filters.min_bedrooms}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
              <select
                name="investment_type"
                value={filters.investment_type}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Both</option>
                <option value="flip">Flip Only</option>
                <option value="rental">Rental Only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Search Properties
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Properties ({properties.length})</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  70% Rule: Max purchase ≤ 70% of ARV - Repairs
                </span>
                <span className="text-sm text-gray-600">
                  1% Rule: Monthly rent ≥ 1% of purchase price
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            
            {properties.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters and search again.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
}

export default App;