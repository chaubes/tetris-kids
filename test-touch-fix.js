/**
 * Touch Button Test Script for Tetris Kids
 * 
 * Run this in the browser console to test touch button functionality
 */

console.log('🔧 Touch Button Test Script Loading...');

// Wait for the game to be initialized
function waitForGame() {
  return new Promise((resolve) => {
    const checkGame = () => {
      if (window.inputController && window.gameEngine) {
        resolve();
      } else {
        console.log('⏳ Waiting for game to initialize...');
        setTimeout(checkGame, 1000);
      }
    };
    checkGame();
  });
}

// Test touch button functionality
async function testTouchButtons() {
  console.log('🧪 Starting Touch Button Tests...');
  
  await waitForGame();
  
  const inputController = window.inputController;
  const gameEngine = window.gameEngine;
  
  console.log('✅ Game systems available');
  
  // Test 1: Check if buttons exist in DOM
  console.log('\n📋 Test 1: DOM Button Existence');
  const buttonSelectors = ['#leftBtn', '#rightBtn', '#downBtn', '#rotateBtn', '#dropBtn'];
  const buttons = {};
  
  buttonSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    const buttonName = selector.replace('#', '').replace('Btn', '');
    buttons[buttonName] = {
      element,
      exists: !!element,
      visible: element ? getComputedStyle(element).display !== 'none' : false,
      touchAction: element ? getComputedStyle(element).touchAction : null
    };
    
    console.log(`${element ? '✅' : '❌'} ${buttonName}: ${element ? 'Found' : 'Not found'}`);
  });
  
  // Test 2: Check InputController setup
  console.log('\n📋 Test 2: InputController Setup');
  const debugInfo = inputController.getDebugInfo();
  console.log('InputController debug info:', debugInfo);
  
  // Test 3: Check event listeners
  console.log('\n📋 Test 3: Event Listeners');
  console.log('Event listeners registered:', debugInfo.eventListeners);
  
  // Test 4: Test manual button trigger
  console.log('\n📋 Test 4: Manual Button Trigger Test');
  
  const testButton = (buttonName, element) => {
    if (!element) {
      console.log(`❌ Cannot test ${buttonName} - element not found`);
      return false;
    }
    
    console.log(`🧪 Testing ${buttonName} button...`);
    
    // Simulate touchstart event
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{
        clientX: element.offsetLeft + element.offsetWidth / 2,
        clientY: element.offsetTop + element.offsetHeight / 2,
        target: element
      }]
    });
    
    try {
      element.dispatchEvent(touchEvent);
      console.log(`✅ ${buttonName} touchstart event dispatched`);
      return true;
    } catch (error) {
      console.error(`❌ Error testing ${buttonName}:`, error);
      return false;
    }
  };
  
  // Test each button
  let successCount = 0;
  Object.entries(buttons).forEach(([name, data]) => {
    if (testButton(name, data.element)) {
      successCount++;
    }
  });
  
  console.log(`\n📊 Test Results: ${successCount}/${Object.keys(buttons).length} buttons working`);
  
  // Test 5: Check game state
  console.log('\n📋 Test 5: Game State Check');
  const gameState = gameEngine.stateManager.getState();
  console.log('Current game state:', gameState.gameState);
  
  if (gameState.gameState !== 'PLAYING') {
    console.warn('⚠️ Game is not in PLAYING state - input may be ignored');
    console.log('💡 Try starting a game first');
  }
  
  // Test 6: Force setup touch controls
  console.log('\n📋 Test 6: Force Touch Setup');
  const forceResult = inputController.forceSetupTouchControls();
  console.log(`Force setup result: ${forceResult ? '✅ Success' : '❌ Failed'}`);
  
  // Final recommendations
  console.log('\n💡 Recommendations:');
  
  if (successCount === 0) {
    console.log('❌ No touch buttons working. Possible issues:');
    console.log('  - DOM elements not found');
    console.log('  - Event listeners not attached');
    console.log('  - CSS preventing touch events');
  } else if (successCount < Object.keys(buttons).length) {
    console.log('⚠️ Some touch buttons not working. Check:');
    console.log('  - Missing DOM elements');
    console.log('  - Incomplete setup');
  } else {
    console.log('✅ All buttons found and testable');
    console.log('  - Try testing on actual mobile device');
    console.log('  - Check game state (should be PLAYING)');
  }
  
  return {
    buttons,
    debugInfo,
    gameState,
    successCount,
    totalButtons: Object.keys(buttons).length
  };
}

// Auto-run the test
testTouchButtons().then(results => {
  console.log('\n🎯 Test Complete!');
  console.log('Results stored in testResults:', results);
  window.testResults = results;
}).catch(error => {
  console.error('❌ Test failed:', error);
});

// Export test function
window.testTouchButtons = testTouchButtons;

console.log('✅ Touch Button Test Script Loaded');
console.log('💡 Run testTouchButtons() to run tests manually');