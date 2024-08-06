import { Loader } from 'lucide-react';

const Loading = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-4">
    <Loader className="animate-spin mr-2" />
    <span>{message}</span>
  </div>
);

export default Loading;
