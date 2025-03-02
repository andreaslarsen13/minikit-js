import React from 'react';

// Mock data for the leaderboard
const topUsers = [
  { username: 'skywalker', country: '🇺🇸', height: 8.72 },
  { username: 'phoneflinger', country: '🇬🇧', height: 8.45 },
  { username: 'gravitychallenger', country: '🇯🇵', height: 7.93 },
  { username: 'airtime', country: '🇦🇺', height: 7.65 },
  { username: 'throwmaster', country: '🇩🇪', height: 7.21 },
  { username: 'heightseeker', country: '🇨🇦', height: 6.98 },
  { username: 'phonelauncher', country: '🇫🇷', height: 6.76 },
  { username: 'skyhigh', country: '🇮🇹', height: 6.54 },
  { username: 'upwards', country: '🇪🇸', height: 6.32 },
  { username: 'apexthrow', country: '🇧🇷', height: 6.11 },
];

// Helper function to capitalize the first letter of each word
const capitalize = (str: string) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const Leaderboard = () => {
  return (
    <div className="mt-12 mb-24">
      {/* Title with globe icon */}
      <div className="flex items-center mb-3">
        <div className="bg-black rounded-full w-6 h-6 flex items-center justify-center mr-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 
          className="text-[15px] font-semibold tracking-[0.04em] text-black" 
          style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          WORLD TOP 10
        </h2>
      </div>

      {/* Leaderboard list */}
      <div className="divide-y divide-gray-100">
        {topUsers.map((user, index) => (
          <div key={index} className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center py-3">
            <span className="text-[#98A1AE] w-5">{index + 1}.</span>
            <span 
              className="text-[14px] font-semibold tracking-[0.04em] text-[#98A1AE]"
              style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {capitalize(user.username)}
            </span>
            <span className="text-base w-6 text-center">{user.country}</span>
            <span 
              className="text-[14px] font-semibold tracking-[0.04em] text-[#98A1AE]"
              style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {user.height.toFixed(2)}M
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; 