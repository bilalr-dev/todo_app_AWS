import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X
} from 'lucide-react';
import { cn, formatDate } from '../../utils/helpers';

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date",
  className = "",
  disabled = false,
  minDate = null,
  maxDate = null,
  label = null,
  allowEmpty = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      try {
        return new Date(value);
      } catch (error) {
        return null;
      }
    }
    return null;
  });
  const [view, setView] = useState('calendar'); // 'calendar', 'months', 'years'
  const [yearRange, setYearRange] = useState({
    start: new Date().getFullYear() - 10,
    end: new Date().getFullYear() + 10
  });
  
  const dropdownRef = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setView('calendar');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
          setSelectedDate(date);
        }
      } catch (error) {
        // Invalid date value, ignore
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDisplayDate = (date) => {
    if (!date) return '';
    // Handle both Date objects and date strings
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDate(dateObj);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Use local date instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
    setView('calendar');
  };

  const handleResetToToday = () => {
    if (allowEmpty) {
      // Clear the date completely
      setSelectedDate(null);
      onChange('');
      setIsOpen(false);
    } else {
      // Reset to today's date
      const today = new Date();
      setSelectedDate(today);
      // Use local date instead of UTC to avoid timezone issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };


  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      if (dateObj < minDateObj) return true;
    }
    if (maxDate) {
      const maxDateObj = new Date(maxDate);
      maxDateObj.setHours(23, 59, 59, 999);
      const dateObj = new Date(date);
      dateObj.setHours(23, 59, 59, 999);
      if (dateObj > maxDateObj) return true;
    }
    return false;
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getYears = () => {
    const years = [];
    for (let year = yearRange.start; year <= yearRange.end; year++) {
      years.push(year);
    }
    return years;
  };

  const navigateYearRange = (direction) => {
    const range = 20;
    setYearRange(prev => ({
      start: prev.start + (direction * range),
      end: prev.end + (direction * range)
    }));
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const monthName = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();

    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView('months')}
              className="text-sm font-medium hover:bg-accent"
            >
              {monthName}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView('years')}
              className="text-sm font-medium hover:bg-accent"
            >
              {year}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(-1)}
              disabled={isDateDisabled(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(1)}
              disabled={isDateDisabled(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-8" />;
            }

            const disabled = isDateDisabled(day);
            const selected = isDateSelected(day);
            const isTodayDate = isToday(day);

            return (
              <Button
                key={day.toISOString()}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 w-10 p-0 text-sm font-normal rounded-md",
                  selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isTodayDate && !selected && "bg-accent text-accent-foreground font-semibold",
                  disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                  !disabled && !selected && !isTodayDate && "hover:bg-accent/50"
                )}
                onClick={() => !disabled && handleDateSelect(day)}
                disabled={disabled}
              >
                {day.getDate()}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('years')}
            className="text-sm font-medium hover:bg-accent"
          >
            {currentMonth.getFullYear()}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('calendar')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "text-sm h-10 rounded-md",
                currentMonth.getMonth() === index && "bg-primary text-primary-foreground hover:bg-primary/90",
                currentMonth.getMonth() !== index && "hover:bg-accent"
              )}
              onClick={() => {
                setCurrentMonth(new Date(currentMonth.getFullYear(), index, 1));
                setView('calendar');
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderYears = () => {
    const years = getYears();
    
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateYearRange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {yearRange.start} - {yearRange.end}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateYearRange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('months')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {years.map(year => (
            <Button
              key={year}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "text-sm h-10 rounded-md",
                currentMonth.getFullYear() === year && "bg-primary text-primary-foreground hover:bg-primary/90",
                currentMonth.getFullYear() !== year && "hover:bg-accent"
              )}
              onClick={() => {
                setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
                setView('months');
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Input
        label={label}
        placeholder={placeholder}
        value={formatDisplayDate(selectedDate)}
        readOnly
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        leftIcon={<Calendar className="h-4 w-4" />}
        rightIcon={
          selectedDate && !disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleResetToToday();
              }}
              className="h-4 w-4 p-0 hover:bg-accent"
              title={allowEmpty ? "Clear date" : "Reset to today"}
            >
              <X className="h-3 w-3" />
            </Button>
          ) : null
        }
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Calendar/Months/Years view */}
          {view === 'calendar' && renderCalendar()}
          {view === 'months' && renderMonths()}
          {view === 'years' && renderYears()}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
