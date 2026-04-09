import React from "react";

const Loader = () => {
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.5rem",
            fontWeight: "bold"
        }}>
            Loading...
        </div>
    );
};

export default Loader;
