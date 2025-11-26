// Test if we can import the admin model
try {
  const Admin = await import('../models/admin.js');
  console.log('✅ Successfully imported admin model');
} catch (error) {
  console.log('❌ Failed to import admin model:', error.message);
}

// Test if we can import mongoose
try {
  const mongoose = await import('mongoose');
  console.log('✅ Successfully imported mongoose');
} catch (error) {
  console.log('❌ Failed to import mongoose:', error.message);
}