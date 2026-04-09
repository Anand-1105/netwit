// import Image from "next/image"

import React from "react"
import image from "../../../public/Hero.png"

const Hero = () => {
    return (
        <div className="relative h-[50vh] w-full overflow-hidden">
            <img src="/Hero.png" alt="Conference Room Booking System" layout="fill" objectFit="cover" priority />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Conference Room Booking System</h1>
                    <p className="text-xl md:text-2xl text-gray-200">Efficiently manage your conference room bookings</p>
                </div>
            </div>
        </div>
    )
}

export default Hero

