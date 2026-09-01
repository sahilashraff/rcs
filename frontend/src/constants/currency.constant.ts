// A small set of common currencies — enough for a platform-wide default
// selector. Not an exhaustive ISO 4217 list; add more here if needed.
export const CURRENCY_OPTIONS = [
    { value: 'INR', label: 'INR — Indian Rupee (₹)' },
    { value: 'USD', label: 'USD — US Dollar ($)' },
    { value: 'EUR', label: 'EUR — Euro (€)' },
    { value: 'GBP', label: 'GBP — British Pound (£)' },
    { value: 'AED', label: 'AED — UAE Dirham (د.إ)' },
    { value: 'SGD', label: 'SGD — Singapore Dollar (S$)' },
    { value: 'AUD', label: 'AUD — Australian Dollar (A$)' },
    { value: 'CAD', label: 'CAD — Canadian Dollar (C$)' },
] as const
