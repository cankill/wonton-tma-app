import {useEffect, useState} from "react";

export const useVisibilityChange = () => {
    const [isVisible, setIsVisible] = useState(!document.hidden);

    useEffect(() => {
        const visibilityChangeHandler = () => {
            setIsVisible(!document.hidden);
        }

        document.addEventListener('visibilitychange', visibilityChangeHandler);

        return () => {
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
        }
    }, []);

    return isVisible;
}