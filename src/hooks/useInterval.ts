import {useEffect, useRef} from "react";

type UseInterval = <T, U>(
    callback: (vars?: U) => T,
    delay: number | undefined,
) => void;

export const useInterval: UseInterval = (callback, delay) => {
    const callbackRef = useRef<typeof callback | undefined>();

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = () => {
            callbackRef.current?.apply(null);
        }

        if (delay) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
