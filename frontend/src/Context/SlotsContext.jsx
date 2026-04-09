import React, { useState, useEffect } from 'react';
import { createContext } from 'react';
import Axios from '../Api/Axios';

// Create the context
const SlotsContext = createContext();

// Create the provider component
export const SlotsContextProvider = ({ children }) => {
    const [slots, setSlots] = useState([]);
    // Fetch all booked slots
    const fetchSlots = async (event) => {
        try {
            const response = await Axios.post('/slot/get-all-booked-slots',{event});
            const data = response.data; // Use response.data for Axios
            console.log(data);
            setSlots(data);
        } catch (error) {
            console.error('Error fetching slots:', error);
            // alert('Error fetching slots: ' + error.message);
        }
    };

    return (
        <SlotsContext.Provider value={{ slots, setSlots, fetchSlots }}>
            {children}
        </SlotsContext.Provider>
    );
};

export default SlotsContext;