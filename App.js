import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import moment from "moment-timezone";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  Text,
  TextInput,
  Button,
  Card,
  Appbar,
  Avatar,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Firebase config — replace with your own
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [localTime, setLocalTime] = useState("");
  const [targetZone, setTargetZone] = useState("");
  const [convertedTime, setConvertedTime] = useState(null);
  const [favoriteZones, setFavoriteZones] = useState([]);

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        Alert.alert("Success", "Account created successfully!");
      })
      .catch((error) => Alert.alert("Error", error.message));
  };

  const handleLogIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        fetchFavoriteZones(userCredential.user.uid);
        Alert.alert("Success", "Logged in successfully!");
      })
      .catch((error) => Alert.alert("Error", error.message));
  };

  const handleLogOut = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setFavoriteZones([]);
        Alert.alert("Success", "Logged out successfully!");
      })
      .catch((error) => Alert.alert("Error", error.message));
  };

  const convertTime = () => {
    if (localTime && targetZone) {
      const time = moment.tz(localTime, targetZone).format("YYYY-MM-DD HH:mm:ss");
      setConvertedTime(time);
    }
  };

  const saveFavoriteZone = async () => {
    if (user) {
      try {
        await addDoc(collection(db, "favoriteZones"), {
          userId: user.uid,
          zone: targetZone,
          time: convertedTime,
        });
        fetchFavoriteZones(user.uid);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    } else {
      Alert.alert("Error", "You must be logged in to save favorite zones.");
    }
  };

  const fetchFavoriteZones = async (userId) => {
    const q = query(collection(db, "favoriteZones"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const zones = [];
    querySnapshot.forEach((doc) => {
      zones.push(doc.data());
    });
    setFavoriteZones(zones);
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="Time Zone Link" />
        {user && <Appbar.Action icon="logout" onPress={handleLogOut} />}
      </Appbar.Header>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {!user ? (
            <View style={styles.authContainer}>
              <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
                Welcome 👋
              </Text>
              <TextInput
                label="Email"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <Button mode="contained" onPress={handleSignUp} style={styles.button}>
                Sign Up
              </Button>
              <Button
                mode="outlined"
                onPress={handleLogIn}
                style={styles.buttonSecondary}
              >
                Log In
              </Button>
            </View>
          ) : (
            <View>
              <TextInput
                label="Enter Local Time (YYYY-MM-DD HH:mm:ss)"
                mode="outlined"
                value={localTime}
                onChangeText={setLocalTime}
                style={styles.input}
              />
              <TextInput
                label="Enter Target Time Zone (e.g., America/New_York)"
                mode="outlined"
                value={targetZone}
                onChangeText={setTargetZone}
                style={styles.input}
              />
              <Button mode="contained" onPress={convertTime} style={styles.button}>
                Convert Time
              </Button>

              {convertedTime && (
                <Card style={styles.resultCard}>
                  <Card.Title
                    title={targetZone}
                    left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
                  />
                  <Card.Content>
                    <Text variant="titleMedium">Converted Time</Text>
                    <Text>{convertedTime}</Text>
                  </Card.Content>
                </Card>
              )}

              <Button
                icon="heart"
                mode="outlined"
                onPress={saveFavoriteZone}
                style={styles.buttonSecondary}
              >
                Save Favorite Zone
              </Button>

              <Text variant="titleLarge" style={{ marginVertical: 20 }}>
                ⭐ Favorite Zones
              </Text>
              <FlatList
                data={favoriteZones}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Card style={styles.zoneCard}>
                    <Card.Content>
                      <Text variant="titleSmall">{item.zone}</Text>
                      <Text>{item.time}</Text>
                    </Card.Content>
                  </Card>
                )}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fafafa",
  },
  authContainer: {
    marginTop: 50,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginVertical: 10,
  },
  buttonSecondary: {
    marginVertical: 10,
  },
  resultCard: {
    marginTop: 20,
    backgroundColor: "#e8f5e9",
  },
  zoneCard: {
    marginBottom: 10,
    backgroundColor: "#f0f4c3",
  },
});
