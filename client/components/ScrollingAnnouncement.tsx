import React, { useState, useEffect, useRef } from 'react';

interface ScrollingAnnouncementProps {
    text: string;
}

const ScrollingAnnouncement: React.FC<ScrollingAnnouncementProps> = ({ text }) => {
    const [isAnimating, setIsAnimating] = useState(true);
    const [duration, setDuration] = useState(30); // Default duration
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const timerRef = useRef<number | null>(null);

    // Effect to calculate and set the animation duration based on text length
    useEffect(() => {
        if (textRef.current && containerRef.current) {
            const textWidth = textRef.current.offsetWidth;
            const containerWidth = containerRef.current.offsetWidth;
            // Speed calculation: 60 pixels per second.
            // Distance to travel = text width + container width (to fully disappear)
            const calculatedDuration = (textWidth + containerWidth) / 60;
            setDuration(Math.max(15, calculatedDuration)); // Set a minimum duration of 15s for short texts
        }
    }, [text]); // Recalculate if the text changes

    // Effect to manage the animation loop (start, end, pause)
    useEffect(() => {
        const textElement = textRef.current;
        if (!textElement) return;

        const handleAnimationEnd = () => {
            setIsAnimating(false); // Stop animation class
            // Set a timeout to restart the animation after 60 seconds
            timerRef.current = window.setTimeout(() => {
                setIsAnimating(true);
            }, 60000); // 60 second pause
        };

        if (isAnimating) {
            // Clear any lingering timer from a previous cycle before starting
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            textElement.addEventListener('animationend', handleAnimationEnd);
        }

        // Cleanup function for when the component unmounts or effect re-runs
        return () => {
            textElement.removeEventListener('animationend', handleAnimationEnd);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isAnimating]); // This effect depends on the animation state

    return (
        <div ref={containerRef} className="announcement-bar">
            <p
                ref={textRef}
                className={`scrolling-text ${isAnimating ? 'is-animating' : ''}`}
                // Pass the calculated duration to the CSS variable
                style={{ '--scroll-duration': `${duration}s` } as React.CSSProperties}
            >
                {text}
            </p>
        </div>
    );
};

export default ScrollingAnnouncement;