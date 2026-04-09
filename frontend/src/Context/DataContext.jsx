import React, { createContext, useState, useEffect } from 'react';
import Axios from '../Api/Axios';

export const DataContext = createContext();

export const DataContextProvider = ({ children }) => {
    const [fileUserData, setFileUserData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchData = async (eventId) => {
        if(!eventId){
            return
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await Axios.get("/files/get-filedata/"+eventId);
            if (response.status >= 300) {
                throw new Error("Failed to fetch data");
            }

            setFileUserData(response.data.users || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error.message || "Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    };

const getUniqueCompanies = () => {    
    const companySet = new Set();
    
    fileUserData?.forEach((user) => {
        if (user.selectedBy && Array.isArray(user.selectedBy)) {
            user.selectedBy.forEach((companyObj) => {
                if (companyObj && companyObj.name) {
                    companySet.add(companyObj.name);
                }
            });
        }
    });
    
    return Array.from(companySet);
};
    
    return (
        <DataContext.Provider 
            value={{ 
                fileUserData, 
                setFileUserData, 
                getUniqueCompanies,
                isLoading,
                error,
                refetch: fetchData
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;