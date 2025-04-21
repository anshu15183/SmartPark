
const express = require('express');
const Floor = require('../models/Floor');
const Booking = require('../models/Booking');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// @route   GET /api/floor
// @desc    Get all floors with availability
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get all floors
    const floors = await Floor.find().sort({ name: 1 });
    
    // Get availability for each floor
    const floorsWithAvailability = await Promise.all(
      floors.map(async (floor) => {
        // Convert to object to make it mutable
        const floorObj = floor.toObject();
        
        // Count active bookings for normal spots
        const normalBookings = await Booking.countDocuments({
          floor: floor._id,
          spotType: 'normal',
          status: { $in: ['pending', 'active'] }
        });
        
        // Count active bookings for disability spots
        const disabilityBookings = await Booking.countDocuments({
          floor: floor._id,
          spotType: 'disability',
          status: { $in: ['pending', 'active'] }
        });
        
        floorObj.availableNormalSpots = Math.max(0, floor.normalSpots - normalBookings);
        floorObj.availableDisabilitySpots = Math.max(0, floor.disabilitySpots - disabilityBookings);
        
        return floorObj;
      })
    );
    
    res.status(200).json({
      success: true,
      floors: floorsWithAvailability
    });
  } catch (error) {
    console.error('Get floors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving floors'
    });
  }
});

// @route   GET /api/floor/available
// @desc    Get available floors for booking
// @access  Private
router.get('/available', protect, async (req, res) => {
  try {
    // Get all floors
    const floors = await Floor.find({ isActive: true }).sort({ name: 1 });
    
    // Convert to UI-friendly format
    const availableFloors = await Promise.all(
      floors.map(async (floor) => {
        // Count active bookings for normal spots
        const normalBookings = await Booking.countDocuments({
          floor: floor._id,
          spotType: 'normal',
          status: { $in: ['pending', 'active'] }
        });
        
        const availableNormalSpots = Math.max(0, floor.normalSpots - normalBookings);
        
        return {
          _id: floor._id,
          name: floor.name,
          disabled: availableNormalSpots <= 0
        };
      })
    );
    
    res.status(200).json({
      success: true,
      floors: availableFloors
    });
  } catch (error) {
    console.error('Get available floors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving available floors'
    });
  }
});

// @route   GET /api/floor/:id
// @desc    Get floor by ID with availability
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // If the ID is "available", it should be handled by the /available endpoint
    if (req.params.id === 'available') {
      return res.status(400).json({
        success: false,
        message: 'Invalid floor ID'
      });
    }
    
    const floor = await Floor.findById(req.params.id);
    
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }
    
    // Convert to object to make it mutable
    const floorWithAvailability = floor.toObject();
    
    // Count active bookings for normal spots
    const normalBookings = await Booking.countDocuments({
      floor: floor._id,
      spotType: 'normal',
      status: { $in: ['pending', 'active'] }
    });
    
    // Count active bookings for disability spots
    const disabilityBookings = await Booking.countDocuments({
      floor: floor._id,
      spotType: 'disability',
      status: { $in: ['pending', 'active'] }
    });
    
    floorWithAvailability.availableNormalSpots = Math.max(0, floor.normalSpots - normalBookings);
    floorWithAvailability.availableDisabilitySpots = Math.max(0, floor.disabilitySpots - disabilityBookings);
    
    res.status(200).json({
      success: true,
      floor: floorWithAvailability
    });
  } catch (error) {
    console.error('Get floor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving floor'
    });
  }
});

module.exports = router;
