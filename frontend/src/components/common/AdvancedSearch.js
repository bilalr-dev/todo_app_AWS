// Advanced search component for v0.6
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  Flag, 
  File, 
  X, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DatePicker from './DatePicker';
import CustomSelect from './CustomSelect';

const AdvancedSearch = ({ 
  onSearch, 
  onFilterChange, 
  filterOptions = {}, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priorities: [],
    categories: [],
    status: 'all',
    startDate: '',
    endDate: '',
    dueStartDate: '',
    dueEndDate: '',
    hasFiles: 'all',
    sortBy: 'created_at',
    sortDirection: 'DESC'
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleSearchChange = async (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    
    if (value.length >= 2) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/advanced/suggestions?q=${encodeURIComponent(value)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFilters(prev => ({ ...prev, search: suggestion.value }));
    setShowSuggestions(false);
  };

  const handlePriorityChange = (priority) => {
    setFilters(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority]
    }));
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDateChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priorities: [],
      categories: [],
      status: 'all',
      startDate: '',
      endDate: '',
      dueStartDate: '',
      dueEndDate: '',
      hasFiles: 'all',
      sortBy: 'created_at',
      sortDirection: 'DESC'
    });
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.priorities.length > 0 || 
           filters.categories.length > 0 || 
           filters.status !== 'all' ||
           filters.startDate || 
           filters.endDate || 
           filters.dueStartDate || 
           filters.dueEndDate || 
           filters.hasFiles !== 'all';
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return null;
    return filters.sortDirection === 'ASC' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={`advanced-search ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search todos, categories, descriptions..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(filters.search.length >= 2)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-150 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors duration-150"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {suggestion.type}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {suggestion.label}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
        >
          <Filter className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          <span>Advanced Filters</span>
          <div className="ml-1 transition-transform duration-200 group-hover:scale-110">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
          >
            <X className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Priority Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <Flag className="w-4 h-4 mr-2 text-blue-500" />
                Priority
              </label>
              <div className="space-y-2">
                {filterOptions.priorities?.map(priority => (
                  <label key={priority} className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={() => handlePriorityChange(priority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <Tag className="w-4 h-4 mr-2 text-green-500" />
                Category
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filterOptions.categories?.map(category => (
                  <label key={category} className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 transition-all duration-200"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <div className="w-4 h-4 mr-2 rounded-full bg-purple-500"></div>
                Status
              </label>
              <CustomSelect
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' }
                ]}
                placeholder="Select status"
              />
            </div>

            {/* Date Range Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                Created Date Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    From
                  </label>
                  <DatePicker
                    value={filters.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    label=""
                    allowEmpty={true}
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    To
                  </label>
                  <DatePicker
                    value={filters.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    label=""
                    allowEmpty={true}
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Due Date Range Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <Calendar className="w-4 h-4 mr-2 text-red-500" />
                Due Date Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    From
                  </label>
                  <DatePicker
                    value={filters.dueStartDate}
                    onChange={(date) => handleDateChange('dueStartDate', date)}
                    label=""
                    allowEmpty={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    To
                  </label>
                  <DatePicker
                    value={filters.dueEndDate}
                    onChange={(date) => handleDateChange('dueEndDate', date)}
                    label=""
                    allowEmpty={true}
                  />
                </div>
              </div>
            </div>

            {/* File Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                <File className="w-4 h-4 mr-2 text-indigo-500" />
                Has Files
              </label>
              <CustomSelect
                value={filters.hasFiles}
                onChange={(value) => setFilters(prev => ({ ...prev, hasFiles: value }))}
                options={[
                  { value: 'all', label: 'All Todos' },
                  { value: 'true', label: 'With Files' },
                  { value: 'false', label: 'Without Files' }
                ]}
                placeholder="Select file filter"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Sort By
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {filterOptions.sortOptions?.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${filters.sortBy === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:scale-105'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  <div className={`transition-transform duration-200 ${filters.sortBy === option.value ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`}>
                    {getSortIcon(option.value)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
