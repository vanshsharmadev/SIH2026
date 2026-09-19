import { useDispatch, useSelector } from 'react-redux';

// Custom convenience hooks for Redux
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);

// Re-export common redux hooks
export { useDispatch, useSelector };
