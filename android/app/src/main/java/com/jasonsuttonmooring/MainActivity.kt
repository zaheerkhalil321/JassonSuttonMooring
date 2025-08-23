package com.jasonsuttonmooring

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "JasonSuttonMooring"
  
  /**
   * Called when the activity is first created. This is where you should initialize your app. We
   * show the native splash screen here.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the splash theme before calling super.onCreate()
    setTheme(R.style.SplashTheme)
    super.onCreate(savedInstanceState)
    // After React Native loads, we'll switch to the app theme
    setTheme(R.style.AppTheme)
  }
  
  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
          DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
