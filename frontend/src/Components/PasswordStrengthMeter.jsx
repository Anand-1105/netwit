import React from 'react';

export const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);
  const getColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="mt-1">
      <div className="h-2 w-full bg-gray-200 rounded-full">
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {strength === 0 && 'Very weak'}
        {strength === 1 && 'Weak'}
        {strength === 2 && 'Fair'}
        {strength === 3 && 'Good'}
        {strength === 4 && 'Strong'}
        {strength === 5 && 'Very strong'}
      </p>
    </div>
  );
};