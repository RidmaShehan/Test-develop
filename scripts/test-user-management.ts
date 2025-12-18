/**
 * Test script for User Management fixes
 * Run with: npx tsx scripts/test-user-management.ts
 */

export {}

const API_BASE = 'http://localhost:3000/api'

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Test Suite
async function runTests() {
  console.log('🧪 Testing User Management Fixes\n')
  console.log('=' .repeat(60))
  
  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Create user with missing fields
  console.log('\n📝 Test 1: Create user with missing fields')
  try {
    const result = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        // Missing email, password, role
      })
    })
    
    if (result.status === 400 && result.data.error?.includes('required')) {
      console.log('✅ PASSED: Validation works correctly')
      testsPassed++
    } else {
      console.log('❌ FAILED: Should return 400 with validation error')
      console.log('Response:', result)
      testsFailed++
    }
  } catch (error) {
    console.log('❌ FAILED: Error during test')
    testsFailed++
  }

  // Test 2: Create user with duplicate email
  console.log('\n📝 Test 2: Create user with duplicate email')
  try {
    // First create a user
    const user1 = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User 1',
        email: 'test@example.com',
        password: 'password123',
        role: 'VIEWER'
      })
    })
    
    // Try to create another with same email
    const user2 = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User 2',
        email: 'test@example.com',
        password: 'password456',
        role: 'VIEWER'
      })
    })
    
    if (user2.status === 400 && user2.data.error?.includes('already exists')) {
      console.log('✅ PASSED: Duplicate email prevented')
      testsPassed++
    } else {
      console.log('❌ FAILED: Should prevent duplicate email')
      console.log('Response:', user2)
      testsFailed++
    }
    
    // Cleanup: delete test user if created
    if (user1.status === 201) {
      await apiCall(`/users/${user1.data.id}`, { method: 'DELETE' })
    }
  } catch (error) {
    console.log('❌ FAILED: Error during test')
    testsFailed++
  }

  // Test 3: Update user and check roles are returned
  console.log('\n📝 Test 3: Update user and verify roles returned')
  try {
    // Create a test user
    const createResult = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'testupdate@example.com',
        password: 'password123',
        role: 'VIEWER'
      })
    })
    
    if (createResult.status === 201) {
      const userId = createResult.data.id
      
      // Update the user
      const updateResult = await apiCall(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated User',
          selectedRoles: []
        })
      })
      
      if (updateResult.status === 200 && updateResult.data.userRoles) {
        console.log('✅ PASSED: User update returns role data')
        testsPassed++
      } else {
        console.log('❌ FAILED: Should return userRoles in response')
        console.log('Response:', updateResult)
        testsFailed++
      }
      
      // Cleanup
      await apiCall(`/users/${userId}`, { method: 'DELETE' })
    } else {
      console.log('❌ FAILED: Could not create test user')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ FAILED: Error during test')
    testsFailed++
  }

  // Test 4: Try to delete non-existent user
  console.log('\n📝 Test 4: Delete non-existent user')
  try {
    const result = await apiCall('/users/nonexistent-id', {
      method: 'DELETE'
    })
    
    if (result.status === 404) {
      console.log('✅ PASSED: Returns 404 for non-existent user')
      testsPassed++
    } else {
      console.log('❌ FAILED: Should return 404')
      console.log('Response:', result)
      testsFailed++
    }
  } catch (error) {
    console.log('❌ FAILED: Error during test')
    testsFailed++
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Test Results:`)
  console.log(`   ✅ Passed: ${testsPassed}`)
  console.log(`   ❌ Failed: ${testsFailed}`)
  console.log(`   📈 Total: ${testsPassed + testsFailed}`)
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.')
  }
}

// Run tests
console.log('Starting tests...')
console.log('Make sure your dev server is running on http://localhost:3000')
console.log('You must be logged in as an ADMIN user\n')

runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})

