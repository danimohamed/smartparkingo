plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    // Last: merges `google-services.json` into the Android build (Firebase / Google Sign-In).
    id("com.google.gms.google-services")
}

import java.util.Properties
import java.io.FileInputStream

// Optional release signing — create android/key.properties (gitignored) with:
//   storeFile=/abs/path/to/keystore.jks
//   storePassword=...
//   keyAlias=...
//   keyPassword=...
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        load(FileInputStream(keystorePropertiesFile))
    }
}

android {
    namespace = "app.parkingo.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "app.parkingo.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystoreProperties.isNotEmpty()) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String?
                keyPassword = keystoreProperties["keyPassword"] as String?
                storeFile = (keystoreProperties["storeFile"] as String?)?.let { file(it) }
                storePassword = keystoreProperties["storePassword"] as String?
            }
        }
    }

    buildTypes {
        release {
            // Use upload keystore when key.properties is present, else fall back
            // to debug keys so `flutter run --release` keeps working locally.
            signingConfig = if (keystoreProperties.isNotEmpty()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}

// Workaround: ensure Flutter creates libs.jar before Kotlin compilation.
// Some Gradle/Kotlin versions attempt to resolve the debugCompileClasspath
// (and thus `build/app/intermediates/flutter/<variant>/libs.jar`) too early.
afterEvaluate {
    tasks.matching { it.name == "compileDebugKotlin" }.configureEach {
        dependsOn("compileFlutterBuildDebug")
    }
    tasks.matching { it.name == "compileProfileKotlin" }.configureEach {
        dependsOn("compileFlutterBuildProfile")
    }
    tasks.matching { it.name == "compileReleaseKotlin" }.configureEach {
        dependsOn("compileFlutterBuildRelease")
    }
}
