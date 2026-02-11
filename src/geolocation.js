// Branches with approximate Gaborone coordinates
const BRANCHES = {
  bontleng: {
    name: 'Bontleng',
    lat: -24.6544,
    lng: 25.9079,
    address: 'Bontleng, Gaborone'
  },
  block9: {
    name: 'Block 9',
    lat: -24.6418,
    lng: 25.9213,
    address: 'Block 9, Gaborone'
  }
};

// Configuration
const CONFIG = {
  MAX_DELIVERY_RADIUS_KM: 15,
  GABORONE_CENTER: { lat: -24.6282, lng: 25.9086 },
  GABORONE_RADIUS_KM: 40 // reasonable city bounds
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if location is within Gaborone
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {boolean} True if within Gaborone area
 */
function isInGaborone(lat, lng) {
  const distanceToCenter = calculateDistance(
    lat, lng,
    CONFIG.GABORONE_CENTER.lat,
    CONFIG.GABORONE_CENTER.lng
  );
  return distanceToCenter <= CONFIG.GABORONE_RADIUS_KM;
}

/**
 * Get user's current location
 * @returns {Promise<{lat: number, lng: number}>} User coordinates
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        let message = 'Unable to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access denied. Please enable location in your browser settings.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Please try again.';
        }
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Check if delivery is available at user location
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {object} {isInRange: boolean, isInGaborone: boolean, reason: string}
 */
export function checkDeliveryAvailability(lat, lng) {
  const inGaborone = isInGaborone(lat, lng);
  
  if (!inGaborone) {
    return {
      isInRange: false,
      isInGaborone: false,
      reason: 'Delivery is currently only available in Gaborone area'
    };
  }

  // Check if within range of any branch
  const closestBranch = getClosestBranch(lat, lng);
  const isInRange = closestBranch.distance <= CONFIG.MAX_DELIVERY_RADIUS_KM;

  return {
    isInRange,
    isInGaborone: true,
    reason: isInRange
      ? `Delivery available! ${closestBranch.name} is ${closestBranch.distance.toFixed(1)} km away`
      : `Sorry, you are ${closestBranch.distance.toFixed(1)} km from ${closestBranch.name}. We deliver within ${CONFIG.MAX_DELIVERY_RADIUS_KM} km`
  };
}

/**
 * Get closest branch to user location
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {object} {name: string, distance: number, branchKey: string}
 */
export function getClosestBranch(lat, lng) {
  let closest = null;
  let minDistance = Infinity;

  Object.entries(BRANCHES).forEach(([key, branch]) => {
    const distance = calculateDistance(lat, lng, branch.lat, branch.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = {
        name: branch.name,
        distance: distance,
        branchKey: key,
        ...branch
      };
    }
  });

  return closest;
}

/**
 * Get all branches with their distances from user
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {array} Array of branches with distances, sorted by distance
 */
export function getAllBranchesWithDistance(lat, lng) {
  return Object.entries(BRANCHES)
    .map(([key, branch]) => ({
      ...branch,
      branchKey: key,
      distance: calculateDistance(lat, lng, branch.lat, branch.lng),
      inDeliveryRange: calculateDistance(lat, lng, branch.lat, branch.lng) <= CONFIG.MAX_DELIVERY_RADIUS_KM
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get all branch options (for form)
 * @returns {array} Array of branch objects
 */
export function getAllBranches() {
  return Object.entries(BRANCHES).map(([key, branch]) => ({
    ...branch,
    branchKey: key
  }));
}

export { CONFIG, BRANCHES };
