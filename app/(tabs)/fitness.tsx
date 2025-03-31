import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Animated, StatusBar } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { manipulateAsync } from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import { useRegistration } from '@/contexts/RegistrationContext';
import { FontAwesome } from '@expo/vector-icons'; // Add this import
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');
const height = width * 1.5; // Maintain aspect ratio

const BodyPartDetector = () => {
  const { userData } = useRegistration();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [model, setModel] = useState(null);
  const [activeBodyPart, setActiveBodyPart] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [imageSource, setImageSource] = useState(null);
  const [poses, setPoses] = useState([]);
  const [mode, setMode] = useState('analysis'); // Start directly in analysis mode
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Add new states for enhanced interaction
  const [highlightedRegions, setHighlightedRegions] = useState({});
  const [activeDescription, setActiveDescription] = useState('');
  const [showRegionLabels, setShowRegionLabels] = useState(true);
  const [activeBodyGroup, setActiveBodyGroup] = useState(null);
  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const cameraRef = useRef(null);
  const isComponentMounted = useRef(true);
  
  // Enhanced body part groups with upper/lower body categorization
  const bodyGroups = {
    upperBody: [ 'shoulders', 'chest', 'arms', 'arms_right', 'core'],
    lowerBody: ['hips', 'upper_legs_left', 'upper_legs_right', 'lower_legs_left', 'lower_legs_right']
  };

  // Enhanced body region descriptions
  const bodyGroupDescriptions = {
    upperBody: "The upper body includes the head, shoulders, chest, arms, and core. These parts handle movement of the arms, breathing, and house vital organs.",
    lowerBody: "The lower body includes the hips, thighs, and lower legs. These parts support body weight, enable walking, and contain powerful muscle groups."
  };

  // Enhanced body part regions with more details and visual properties
  const predefinedRegions = [
    { 
      id: 'shoulders', 
      name: 'Shoulders', 
      x: 0.7, 
      y: 0.15, 
      radius: 40, 
      color: '#4285F4', // Google blue
      description: 'Connects arms to torso, allows arm movement',
      group: 'upperBody'
    },
    { 
      id: 'chest', 
      name: 'Chest', 
      x: 0.5, 
      y: 0.25, 
      radius: 40, 
      color: '#34A853', // Google green
      description: 'Upper torso, houses heart and lungs',
      group: 'upperBody'
    },
    { 
      id: 'arms', 
      name: 'Arms', 
      x: 0.25, 
      y: 0.3, 
      radius: 30, 
      color: '#FBBC05', // Google yellow
      description: 'Upper limbs, includes biceps and triceps',
      group: 'upperBody'
    },
    { 
      id: 'arms_right', 
      name: 'Arms', 
      x: 0.75, 
      y: 0.3, 
      radius: 30, 
      color: '#FBBC05', // Google yellow
      description: 'Upper limbs, includes biceps and triceps',
      group: 'upperBody'
    },
    { 
      id: 'core', 
      name: 'core', 
      x: 0.5, 
      y: 0.4, 
      radius: 35, 
      color: '#EA4335', // Google red
      description: 'Mid-torso, houses digestive organs',
      group: 'upperBody'
    },
    { 
      id: 'hips', 
      name: 'Hips', 
      x: 0.5, 
      y: 0.5, 
      radius: 40, 
      color: '#4285F4', // Google blue
      description: 'Pelvic region, connects legs to torso',
      group: 'lowerBody'
    },
    { 
      id: 'upper_legs_left', 
      name: 'Upper Legs', 
      x: 0.4, 
      y: 0.65, 
      radius: 35, 
      color: '#34A853', // Google green
      description: 'Thighs, contains quadriceps and hamstrings',
      group: 'lowerBody'
    },
    { 
      id: 'upper_legs_right', 
      name: 'Upper Legs', 
      x: 0.6, 
      y: 0.65, 
      radius: 35, 
      color: '#34A853', // Google green
      description: 'Thighs, contains quadriceps and hamstrings',
      group: 'lowerBody'
    },
    { 
      id: 'lower_legs_left', 
      name: 'Lower Legs', 
      x: 0.4, 
      y: 0.8, 
      radius: 30, 
      color: '#FBBC05', // Google yellow
      description: 'Calves and shins, connects to feet',
      group: 'lowerBody'
    },
    { 
      id: 'lower_legs_right', 
      name: 'Lower Legs', 
      x: 0.6, 
      y: 0.8, 
      radius: 30, 
      color: '#FBBC05', // Google yellow
      description: 'Calves and shins, connects to feet',
      group: 'lowerBody'
    },
  ];
  
  // Body part mapping for MoveNet model (used when we have real detection)
  const bodyPartNames = {
    0: 'Nose',
    1: 'Left Eye',
    2: 'Right Eye',
    3: 'Left Ear',
    4: 'Right Ear',
    5: 'Left Shoulder',
    6: 'Right Shoulder',
    7: 'Left Elbow',
    8: 'Right Elbow',
    9: 'Left Wrist',
    10: 'Right Wrist',
    11: 'Left Hip',
    12: 'Right Hip',
    13: 'Left Knee',
    14: 'Right Knee',
    15: 'Left Ankle',
    16: 'Right Ankle'
  };
  
  // Enhanced region mapping for higher-level body parts
  const bodyRegions = {
    'Head': [0, 1, 2, 3, 4],
    'Shoulders': [5, 6],
    'Arms': [7, 8, 9, 10],
    'Chest': [5, 6], // Overlaps with shoulders
    'core': [5, 6, 11, 12],
    'Hips': [11, 12],
    'Upper Legs': [11, 12, 13, 14],
    'Lower Legs': [13, 14, 15, 16]
  };
  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Start pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

 // Initialize TensorFlow.js and load the pose detection model
useEffect(() => {
  const setup = async () => {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js ready');
      
      // Load the pose detection model
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };
      
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      
      setModel(detector);
      setIsModelReady(true);
      console.log('Pose detection model loaded');
      
      // Load default image immediately
      await loadDefaultImage();
      
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only run setup if userData exists and has gender property
  if (userData && userData.gender) {
    console.log('User data available with gender:', userData.gender);
    setup();
  } else {
    console.log('Waiting for complete user data...');
  }
}, [userData]); // Keep userData in dependency array
  
  // Request permissions
  useEffect(() => {
    (async () => {
      // Ask for camera permission
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setHasPermission(
        cameraPermission.status === 'granted' && 
        galleryPermission.status === 'granted'
      );
    })();
  }, []);
 
  const loadDefaultImage = async () => {
    try {
      if (!userData || !userData.gender) {
        console.error('Cannot load default image: user data or gender not available');
        return;
      }
      
      const defaultImageUri = userData.gender === "male" || userData.gender === "other" ? 
        require("../../assets/images/male.jpeg") : 
        require("../../assets/images/female.jpeg");
      
      console.log("Setting default image source:", defaultImageUri);
      setImageSource(defaultImageUri);
      
      // Skip the analysis for now
      // analyzeImage(asset.localUri);
      
    } catch (error) {
      console.error('Error loading default image:', error);
    }
  };
  
  // Take a picture from camera
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImageSource(photo.uri);
        setMode('analysis');
        
        // Reset highlighted regions when taking a new picture
        setHighlightedRegions({});
        setActiveBodyPart('');
        setActiveDescription('');
        setActiveBodyGroup(null);
        
        // Analyze the image for poses
        analyzeImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };
  
  // Pick an image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImageSource(result.assets[0].uri);
      setMode('analysis');
      
      // Reset highlighted regions when selecting a new image
      setHighlightedRegions({});
      setActiveBodyPart('');
      setActiveDescription('');
      setActiveBodyGroup(null);
      
      // Analyze the image for poses
      analyzeImage(result.assets[0].uri);
    }
  };
  
 // Helper function to load an image as a tensor - REACT NATIVE SPECIFIC
const loadImageTensor = async (uri) => {
  try {
    console.log("Loading image tensor from URI:", uri);
    
    // React Native with TensorFlow.js approach
    // This uses the proper method for React Native environments
    const imgB64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create a tensor from the base64 encoded image
    const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
    const raw = new Uint8Array(imgBuffer);
    const imageTensor = decodeJpeg(raw);
    
    // Resize and normalize the tensor
    const processedTensor = tf.image.resizeBilinear(
      imageTensor,
      [480, 640]
    ).expandDims(0);
    
    // Clean up the original tensor
    imageTensor.dispose();
    
    return processedTensor;
  } catch (error) {
    console.error('Error loading image tensor:', error);
    
    // Return a dummy tensor as fallback
    console.log("Creating dummy tensor as fallback");
    return tf.zeros([1, 480, 640, 3]);
  }
};

// Analyze an image for pose detection with React Native specific approach
const analyzeImage = async (uri) => {
  if (!model) {
    console.log("Model not available, skipping analysis");
    return;
  }
  
  try {
    console.log("Analyzing image:", uri);
    
    // For local assets and camera captured images
    try {
      // Use expo-file-system to check if the URI is valid
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist: " + uri);
      }
      
      console.log("File exists, proceeding with analysis");
      
      // Manipulate the image to ensure correct format using expo-image-manipulator
      const imageAsset = await manipulateAsync(
        uri,
        [{ resize: { width: 640, height: 480 } }],
        { compress: 0.8, format: 'jpeg' }
      );
      
      console.log("Image manipulated successfully:", imageAsset.uri);
      
      // Skip tensor operations and just use the predefined regions
      // This is a fallback approach that will still allow interaction
      setPoses([]);
      
      // If you still want to attempt tensor operations, uncomment this:
      /*
      // Load the image as tensor
      const imageTensor = await loadImageTensor(imageAsset.uri);
      
      if (imageTensor) {
        console.log("Image tensor loaded, running pose detection");
        // Run pose detection
        try {
          const poses = await model.estimatePoses(imageTensor);
          console.log("Pose detection completed:", poses.length > 0 ? "Poses found" : "No poses found");
          setPoses(poses);
        } catch (poseError) {
          console.error("Error during pose detection:", poseError);
          // Continue without poses
          setPoses([]);
        }
        
        // Clean up
        console.log("Disposing tensor");
        tf.dispose(imageTensor);
      } else {
        console.log("No image tensor created, skipping pose detection");
        setPoses([]);
      }
      */
      
    } catch (manipulationError) {
      console.error("Image processing failed:", manipulationError);
      // Continue with empty poses
      setPoses([]);
    }
  } catch (error) {
    console.error('Fatal error in analyzeImage:', error);
    setPoses([]);
  }
};
  // Switch to camera mode
  const switchToCamera = () => {
    setMode('camera');
    setActiveBodyPart('');
    setActiveDescription('');
    setActiveBodyGroup(null);
    setHighlightedRegions({});
  };
  // Toggle region labels visibility
  const toggleRegionLabels = () => {
    setShowRegionLabels(!showRegionLabels);
  };
  
  // Function to handle selecting a body group (upper or lower)
  const handleBodyGroupSelection = (groupName) => {
    // If the group is already active, deactivate it
    if (activeBodyGroup === groupName) {
      setActiveBodyGroup(null);
      
      // Clear any highlighted regions from this group
      const updatedHighlights = { ...highlightedRegions };
      bodyGroups[groupName].forEach(regionId => {
        delete updatedHighlights[regionId];
      });
      
      setHighlightedRegions(updatedHighlights);
      setActiveBodyPart('');
      setActiveDescription('');
    } else {
      // Activate this group
      setActiveBodyGroup(groupName);
      
      // Highlight all regions in this group
      const updatedHighlights = { ...highlightedRegions };
      
      // First, clear any highlighted regions from other groups
      if (groupName === 'upperBody') {
        bodyGroups['lowerBody'].forEach(regionId => {
          delete updatedHighlights[regionId];
        });
      } else {
        bodyGroups['upperBody'].forEach(regionId => {
          delete updatedHighlights[regionId];
        });
      }
      
      // Then highlight all regions in the selected group
      bodyGroups[groupName].forEach(regionId => {
        updatedHighlights[regionId] = true;
      });
      
      setHighlightedRegions(updatedHighlights);
      
      // Set the active description to the group description
      setActiveBodyPart(groupName === 'upperBody' ? 'Upper Body' : 'Lower Body');
      setActiveDescription(bodyGroupDescriptions[groupName]);
      
      // Center the tooltip
      setTooltipPosition({
        x: width / 2,
        y: groupName === 'upperBody' ? height * 0.25 : height * 0.65
      });
    }
  };
  
  // Reset all highlights
  const resetHighlights = () => {
    setHighlightedRegions({});
    setActiveBodyPart('');
    setActiveDescription('');
    setActiveBodyGroup(null);
  };
  
  // Get opacity for region highlights
  const getRegionOpacity = (regionId) => {
    // If this region is individually highlighted
    if (highlightedRegions[regionId]) {
      return 0.8;
    }
    
    // If a body group is active and this region belongs to it
    if (activeBodyGroup && bodyGroups[activeBodyGroup].includes(regionId)) {
      return 0.7;  // Slightly less opaque than individually highlighted
    }
    
    // Default low opacity
    return 0.2;
  };
  
  // Enhanced function for region touch with single region selection
  const handleRegionTouch = (region) => {
    // If no body group is active, implement single region selection
    if (!activeBodyGroup) {
      // Check if this region is already highlighted
      const isAlreadyHighlighted = highlightedRegions[region.id];
      
      if (isAlreadyHighlighted) {
        // If already highlighted, just toggle it off
        const updatedHighlights = { ...highlightedRegions };
        delete updatedHighlights[region.id];
        setHighlightedRegions(updatedHighlights);
        setActiveBodyPart('');
        setActiveDescription('');
      } else {
        // If not highlighted, clear all other highlights and set this one
        const newHighlights = {};
        newHighlights[region.id] = true;
        setHighlightedRegions(newHighlights);
        setActiveBodyPart(region.name);
        setActiveDescription(region.description);
        setTooltipPosition({ 
          x: region.x * width, 
          y: region.y * height - 40 
        });
      }
    } else {
      // If a body group is active, toggle just this region
      setActiveBodyPart(region.name);
      setActiveDescription(region.description);
      setTooltipPosition({ 
        x: region.x * width, 
        y: region.y * height - 40 
      });
      
      // Toggle highlight for this region
      setHighlightedRegions(prev => ({
        ...prev,
        [region.id]: !prev[region.id]
      }));
      
      // Clear any active body group
      setActiveBodyGroup(null);
    }
  };
  
  // Update the handleImageTouch function to handle body groups and single region selection
  const handleImageTouch = (event) => {
    if (poses && poses.length > 0) {
      // If we have pose detection data, use it
      const { locationX, locationY } = event.nativeEvent;
      
      // Find the closest keypoint to the touch
      let closestKeypoint = null;
      let closestDistance = Infinity;
      
      poses[0].keypoints.forEach((keypoint) => {
        // Scale keypoint coordinates to match the displayed image
        const scaledX = keypoint.x * width / 640;
        const scaledY = keypoint.y * height / 480;
        
        const distance = Math.sqrt(
          Math.pow(scaledX - locationX, 2) + 
          Math.pow(scaledY - locationY, 2)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestKeypoint = keypoint;
        }
      });
      
      // Only register if touch is reasonably close to a keypoint
      if (closestDistance < 50 && closestKeypoint) {
        // Find which body region this keypoint belongs to
        let detectedRegion = '';
        let regionId = '';
        
        for (const [region, keypointIndices] of Object.entries(bodyRegions)) {
          if (keypointIndices.includes(closestKeypoint.id)) {
            detectedRegion = region;
            regionId = region.toLowerCase().replace(' ', '_');
            break;
          }
        }
        
        // If no region found, use the specific body part name
        const bodyPartName = detectedRegion || bodyPartNames[closestKeypoint.id];
        
        // Implement single region selection logic
        if (!activeBodyGroup) {
          // Check if this region is already highlighted
          const isAlreadyHighlighted = (regionId && highlightedRegions[regionId]);
          
          if (isAlreadyHighlighted) {
            // If already highlighted, toggle off
            const updatedHighlights = { ...highlightedRegions };
            delete updatedHighlights[regionId];
            setHighlightedRegions(updatedHighlights);
            setActiveBodyPart('');
            setActiveDescription('');
          } else if (regionId) {
            // If not highlighted, clear all others and highlight this one
            const newHighlights = {};
            newHighlights[regionId] = true;
            setHighlightedRegions(newHighlights);
            
            setActiveBodyPart(bodyPartName);
            setTooltipPosition({ 
              x: closestKeypoint.x * width / 640, 
              y: closestKeypoint.y * height / 480 - 40 
            });
            
            // Find a description for this body part
            let description = '';
            if (regionId) {
              const matchingRegion = predefinedRegions.find(r => 
                r.id.includes(regionId.toLowerCase().replace(' ', '_')));
              if (matchingRegion) {
                description = matchingRegion.description;
              }
            }
            setActiveDescription(description);
          }
        } else {
          // With a body group active, behave normally
          setActiveBodyPart(bodyPartName);
          setTooltipPosition({ 
            x: closestKeypoint.x * width / 640, 
            y: closestKeypoint.y * height / 480 - 40 
          });
          
          // Find a description for this body part
          let description = '';
          if (regionId) {
            const matchingRegion = predefinedRegions.find(r => 
              r.id.includes(regionId.toLowerCase().replace(' ', '_')));
            if (matchingRegion) {
              description = matchingRegion.description;
            }
          }
          setActiveDescription(description);
          
          // Toggle highlight for this region
          if (regionId) {
            setHighlightedRegions(prev => ({
              ...prev,
              [regionId]: !prev[regionId]
            }));
          }
          
          // Clear any active body group
          setActiveBodyGroup(null);
        }
      }
    } else {
      // If no pose detection data, check against predefined regions
      const { locationX, locationY } = event.nativeEvent;
      
      // Find if we touched a predefined region
      for (const region of predefinedRegions) {
        const regionX = region.x * width;
        const regionY = region.y * height;
        const distance = Math.sqrt(
          Math.pow(regionX - locationX, 2) + 
          Math.pow(regionY - locationY, 2)
        );
        
        if (distance < region.radius) {
          handleRegionTouch(region);
          return;
        }
      }
      
      // If we didn't touch any region and not in a group, clear all
      if (!activeBodyGroup) {
        setActiveBodyPart('');
        setActiveDescription('');
        setHighlightedRegions({});
      }
    }
  };
 
// Initialize TensorFlow.js and load the pose detection model
useEffect(() => {
  const setup = async () => {
    try {
      // Load default image immediately
      await loadDefaultImage();
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js ready');
      
      // Load the pose detection model
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };
      
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      
      setModel(detector);
      setIsModelReady(true);
      console.log('Pose detection model loaded');
      
      
      
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only run setup if userData exists and has gender property
  if (userData && userData.gender) {
    console.log('User data available with gender:', userData.gender);
    setup();
  } else {
    console.log('Waiting for complete user data...');
  }
}, [userData]); // Keep userData in dependency array

  // Camera Screen - USING CAMERAVIEW INSTEAD OF CAMERA
  if (mode === 'camera') {
    return (
      <View style={styles.container}>
      {/* Camera view must be the first element to ensure it's at the bottom of the z-index stack */}
      <CameraView
        ref={cameraRef}
        style={{ 
          width, 
          height,
          position: 'absolute',  // Position absolutely to ensure it covers the full container
          top: 0,
          left: 0
        }}
        type={"front"}
        onPictureTaken={(photo) => {
          if (photo && photo.uri) {
            setImageSource(photo.uri);
            setMode('analysis');
            
            // Reset highlighted regions when taking a new picture
            setHighlightedRegions({});
            setActiveBodyPart('');
            setActiveDescription('');
            setActiveBodyGroup(null);
            
            // Analyze the image for poses
            analyzeImage(photo.uri);
          }
        }}
      />
      
      {/* UI overlay elements */}
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent'  // Transparent background to let camera show through
      }}>
        {/* Back button */}
        <TouchableOpacity 
          style={[styles.button, {
            position: 'absolute',
            top: 40,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }]}
          onPress={() => setMode('analysis')}
        >
          <Text>
            <FontAwesome name="arrow-left" size={24} color="white" />
          </Text>
        </TouchableOpacity>
        
        {/* Camera controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={[styles.button, styles.captureButton]} 
            onPress={takePicture}
          >
            <Text>
              <FontAwesome name="camera" size={28} color="white" />
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.instructions, {
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: 10
        }]}>
          Position yourself in the frame
        </Text>
      </View>
    </View>
    );
  }
  
// Replace your existing loading state check with this improved version
// Loading state
if (isLoading) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
      <Text style={styles.loadingText}>Loading resources...</Text>
    </View>
  );
}

// Permission check
if (hasPermission === null) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
      <Text style={styles.loadingText}>Requesting permissions...</Text>
    </View>
  );
}

// User data check - this was likely causing your issue
if (!userData || userData.gender === undefined) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
      <Text style={styles.loadingText}>Waiting for user data...</Text>
    </View>
  );
}

// No permission state
if (hasPermission === false) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>No access to camera or gallery</Text>
    </View>
  );
}
  
  // Analysis Screen (default mode)
  return (
    <SafeAreaView style={styles.container}>
       <StatusBar style="auto" />
            
            <Stack.Screen
              options={{
                title: 'Workout',
                headerShown: true,
              }}
            />
      <View style={styles.imageContainer}>
        <TouchableOpacity 
          onPress={handleImageTouch}
          activeOpacity={1}
          style={{ width: width, height: height }}
        >
          <Image 
            source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource} 
            style={{ width: width, height: height }} 
            resizeMode="contain"
          />
          
          {/* Display predefined body part regions when no pose detection */}
          {(!poses || poses.length === 0) && predefinedRegions.map((region, index) => (
            <Animated.View
              key={index}
              style={[
                styles.bodyPartRegion,
                {
                  left: region.x * width - region.radius,
                  top: region.y * height - region.radius,
                  width: region.radius * 2,
                  height: region.radius * 2,
                  borderRadius: region.radius,
                  backgroundColor: `${region.color}${Math.floor(getRegionOpacity(region.id) * 255).toString(16).padStart(2, '0')}`,
                  borderColor: region.color,
                  transform: [
                    { 
                      scale: (highlightedRegions[region.id] || 
                             (activeBodyGroup && bodyGroups[activeBodyGroup].includes(region.id))) 
                             ? pulseAnim : 1 
                    }
                  ],
                  zIndex: (highlightedRegions[region.id] || 
                          (activeBodyGroup && bodyGroups[activeBodyGroup].includes(region.id))) 
                          ? 10 : 1
                }
              ]}
            >
              <TouchableOpacity
                style={styles.regionTouchable}
                onPress={() => handleRegionTouch(region)}
              >
                {showRegionLabels && (
                  <View style={styles.regionLabel}>
                    <Text style={styles.regionLabelText}>{region.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}

    {/* Display pose keypoints when available */}
    {poses && poses.length > 0 && poses[0].keypoints.map((keypoint, index) => (
            keypoint.score > 0.3 && (
              <TouchableOpacity
                key={index}
                style={[
                  styles.poseKeypoint,
                  {
                    left: keypoint.x * width / 640 - 15,
                    top: keypoint.y * height / 480 - 15,
                    // Find if this keypoint belongs to any highlighted region
                    backgroundColor: (() => {
                      for (const [region, keypointIndices] of Object.entries(bodyRegions)) {
                        const regionId = region.toLowerCase().replace(' ', '_');
                        if (keypointIndices.includes(keypoint.id) && (
                            highlightedRegions[regionId] || 
                            (activeBodyGroup === 'upperBody' && bodyGroups.upperBody.some(id => id.includes(regionId.toLowerCase()))) ||
                            (activeBodyGroup === 'lowerBody' && bodyGroups.lowerBody.some(id => id.includes(regionId.toLowerCase())))
                          )) {
                          return 'rgba(234, 67, 53, 0.8)'; // Highlighted
                        }
                      }
                      return 'rgba(234, 67, 53, 0.3)'; // Normal
                    })()
                  }
                ]}
                onPress={() => {
                  // Find which body region this keypoint belongs to
                  let detectedRegion = '';
                  let regionId = '';
                  
                  for (const [region, keypointIndices] of Object.entries(bodyRegions)) {
                    if (keypointIndices.includes(keypoint.id)) {
                      detectedRegion = region;
                      regionId = region.toLowerCase().replace(' ', '_');
                      break;
                    }
                  }
                  
                  // If no region found, use the specific body part name
                  const bodyPartName = detectedRegion || bodyPartNames[keypoint.id];
                  
                  // Implement single region selection logic
                  if (!activeBodyGroup) {
                    // Check if this region is already highlighted
                    const isAlreadyHighlighted = (regionId && highlightedRegions[regionId]);
                    
                    if (isAlreadyHighlighted) {
                      // If already highlighted, toggle off
                      const updatedHighlights = { ...highlightedRegions };
                      delete updatedHighlights[regionId];
                      setHighlightedRegions(updatedHighlights);
                      setActiveBodyPart('');
                      setActiveDescription('');
                    } else if (regionId) {
                      // If not highlighted, clear all others and highlight this one
                      const newHighlights = {};
                      newHighlights[regionId] = true;
                      setHighlightedRegions(newHighlights);
                      
                      setActiveBodyPart(bodyPartName);
                      setTooltipPosition({ 
                        x: keypoint.x * width / 640, 
                        y: keypoint.y * height / 480 - 40 
                      });
                      
                      // Find a description for this body part
                      let description = '';
                      if (regionId) {
                        const matchingRegion = predefinedRegions.find(r => 
                          r.id.includes(regionId.toLowerCase().replace(' ', '_')));
                        if (matchingRegion) {
                          description = matchingRegion.description;
                        }
                      }
                      setActiveDescription(description);
                    }
                  } else {
                    // With a body group active, behave normally
                    setActiveBodyPart(bodyPartName);
                    setTooltipPosition({ 
                      x: keypoint.x * width / 640, 
                      y: keypoint.y * height / 480 - 40 
                    });
                    
                    // Find a description for this body part
                    let description = '';
                    if (regionId) {
                      const matchingRegion = predefinedRegions.find(r => 
                        r.id.includes(regionId.toLowerCase().replace(' ', '_')));
                      if (matchingRegion) {
                        description = matchingRegion.description;
                      }
                    }
                    setActiveDescription(description);
                    
                    // Toggle highlight for this region
                    if (regionId) {
                      setHighlightedRegions(prev => ({
                        ...prev,
                        [regionId]: !prev[regionId]
                      }));
                    }
                    
                    // Clear any active body group
                    setActiveBodyGroup(null);
                  }
                }}
              >
                <Animated.View 
                  style={[
                    styles.keypointInner,
                    // Pulse the inner point if region is highlighted
                    {
                      transform: [
                        { 
                          scale: (() => {
                            for (const [region, keypointIndices] of Object.entries(bodyRegions)) {
                              const regionId = region.toLowerCase().replace(' ', '_');
                              if (keypointIndices.includes(keypoint.id) && (
                                  highlightedRegions[regionId] || 
                                  (activeBodyGroup === 'upperBody' && bodyGroups.upperBody.some(id => id.includes(regionId.toLowerCase()))) ||
                                  (activeBodyGroup === 'lowerBody' && bodyGroups.lowerBody.some(id => id.includes(regionId.toLowerCase())))
                                )) {
                                return pulseAnim;
                              }
                            }
                            return 1;
                          })()
                        }
                      ]
                    }
                  ]}
                />
              </TouchableOpacity>
            )
          ))}
          
          {/* Enhanced tooltip for active body part or group */}
          {activeBodyPart ? (
            <Animated.View
              style={[
                styles.tooltip,
                {
                  left: tooltipPosition.x - 75,
                  top: tooltipPosition.y,
                  transform: [{ scale: pulseAnim }],
                  // Make the tooltip wider for group selections
                  width: activeBodyPart === 'Upper Body' || activeBodyPart === 'Lower Body' ? 200 : 150,
                }
              ]}
            >
              <Text style={styles.tooltipTitle}>{activeBodyPart}</Text>
              {activeDescription ? (
                <Text style={styles.tooltipDescription}>{activeDescription}</Text>
              ) : null}
              
              {/* Add a hint for group selections */}
              {(activeBodyPart === 'Upper Body' || activeBodyPart === 'Lower Body') && (
                <Text style={styles.tooltipHint}>
                  Tap on individual regions for more details
                </Text>
              )}
            </Animated.View>
          ) : null}

                {/* Overlay buttons for upper and lower body selection */}
          <View style={styles.overlayButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.overlayButton, 
                activeBodyGroup === 'upperBody' && styles.activeOverlayButton
              ]} 
              onPress={() => handleBodyGroupSelection('upperBody')}
            >
              <Text style={styles.overlayButtonIcon}>👆</Text>
              <Text style={styles.overlayButtonText}>Upper Body</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.overlayButton, 
                activeBodyGroup === 'lowerBody' && styles.activeOverlayButton
              ]} 
              onPress={() => handleBodyGroupSelection('lowerBody')}
            >
              <Text style={styles.overlayButtonIcon}>👇</Text>
              <Text style={styles.overlayButtonText}>Lower Body</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
      
{/* Bottom control panel */}
<View style={styles.controlPanel}>
  <TouchableOpacity 
    style={[styles.controlButton, styles.cameraButton]} 
    onPress={switchToCamera}
  >
      <Text style={{ color: 'white', marginRight: 8 }}>

    <FontAwesome name="camera" size={18}  />
    </Text>
    <Text style={styles.controlButtonText}>Camera</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={[styles.controlButton, styles.galleryButton]} 
    onPress={pickImage}
  >

<Text style={{ color: 'white', marginRight: 8 }}>
    <FontAwesome name="image" size={18}  />
    </Text>
    <Text style={styles.controlButtonText}>Gallery</Text>
  </TouchableOpacity>
</View>

      
      <Text style={styles.instructions}>
        Tap on highlighted regions to identify and learn about body parts
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed from '#f5f5f5' to transparent
    position: 'relative',  // Ensure position relative for absolute children
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  loader: {
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: 'red',
  },
  bodyPartRegion: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  regionTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  poseKeypoint: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: 'rgba(234, 67, 53, 0.3)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  keypointInner: {
    width: 12,
    height: 12,
    backgroundColor: 'rgba(234, 67, 53, 0.9)',
    borderRadius: 6,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    width: 150,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  tooltipTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  tooltipDescription: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  tooltipHint: {
    color: '#ccc',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  // Overlay buttons styles
  overlayButtonsContainer: {
    position: 'absolute',
    left: 15,
    top: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    zIndex: 50,
  },
  overlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeOverlayButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.9)',
    borderColor: '#3367d6',
  },
  overlayButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  overlayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cameraButton: {
    backgroundColor: '#4285F4',
  },
  galleryButton: {
    backgroundColor: '#34A853',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  captureButton: {
    backgroundColor: '#EA4335',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    padding: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default BodyPartDetector;