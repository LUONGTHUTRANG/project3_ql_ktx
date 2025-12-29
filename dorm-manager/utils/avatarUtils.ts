/**
 * Generate avatar URL or default avatar with initials
 * @param avatarUrl - User's avatar URL
 * @param fullName - User's full name for generating initials
 * @returns Avatar URL or initials-based avatar data URL
 */
export const getAvatarUrl = (avatarUrl?: string, fullName?: string): string => {
  // If avatar URL exists and is not empty, return it
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl;
  }

  // Generate default avatar with initials
  if (!fullName || fullName.trim().length === 0) {
    // Fallback to a default avatar
    return getDefaultAvatarDataUrl('?');
  }

  const initial = fullName.trim().charAt(0).toUpperCase();
  return getDefaultAvatarDataUrl(initial);
};

/**
 * Generate a colored avatar with initials
 * @param initial - Single character to display
 * @returns Data URL for the avatar
 */
export const getDefaultAvatarDataUrl = (initial: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52B788'
  ];

  // Use character code to consistently select a color
  const charCode = initial.charCodeAt(0);
  const colorIndex = charCode % colors.length;
  const bgColor = colors[colorIndex];

  // Create SVG for avatar
  const svg = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="${bgColor}"/>
      <text x="50%" y="50%" font-size="56" font-weight="bold" fill="white" 
            text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">
        ${initial}
      </text>
    </svg>
  `;

  // Convert SVG to data URL
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
};

/**
 * Get initials from full name for display
 * @param fullName - User's full name
 * @returns First character(s) of the name
 */
export const getInitials = (fullName?: string): string => {
  if (!fullName || fullName.trim().length === 0) {
    return '?';
  }

  const names = fullName.trim().split(' ');
  
  // If only one name, return first character
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  // Return first character of first and last name
  const first = names[0].charAt(0);
  const last = names[names.length - 1].charAt(0);
  return (first + last).toUpperCase();
};
