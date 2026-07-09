import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';export default function HomeScreen({ navigation }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, logout } = useContext(AuthContext);

    const checkApi = async () => {
        setLoading(true);
        setError(null);
        try {
            // Testing connection to the Laravel backend. 
            // Adjust the endpoint to a valid API route in your Laravel app if needed.
            const response = await api.get('/user');
            setData(response.data);
        } catch (err) {
            console.error('API Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Carwash App</Text>
            <Text style={styles.subtitle}>React Native frontend for Laravel</Text>

            <View style={styles.apiTestContainer}>
                <Button title="Test API Connection" onPress={checkApi} />
                
                {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
                
                {error && (
                    <Text style={styles.errorText}>Error: {error}</Text>
                )}
                
                {data && (
                    <Text style={styles.successText}>Success! Data: {JSON.stringify(data)}</Text>
                )}
            </View>

            <View style={{ marginTop: 40 }}>
                <Text style={{ marginBottom: 10, textAlign: 'center' }}>
                    Logged in as: {user ? user.name : 'Unknown'}
                </Text>
                <Button title="Logout" onPress={logout} color="red" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    apiTestContainer: {
        width: '100%',
        marginTop: 20,
        alignItems: 'center',
    },
    loader: {
        marginTop: 20,
    },
    errorText: {
        marginTop: 20,
        color: 'red',
        textAlign: 'center',
    },
    successText: {
        marginTop: 20,
        color: 'green',
        textAlign: 'center',
    },
});
