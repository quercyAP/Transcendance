import React, { Dispatch, SetStateAction, useState } from 'react';
import { ChannelType, createChannel } from '../../services/ApiServiceDto';
import css from "../../styles/ChatRoomList.module.css";
interface ChannelFormProps {
  onCreateChannel: (channelData: createChannel) => void;
  setShow: Dispatch<SetStateAction<boolean>>;
}


const ChannelForm: React.FC<ChannelFormProps> = ({ onCreateChannel, setShow }) => {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>(ChannelType.PUBLIC);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreateChannel({ name: channelName, type: channelType, password: password });
  };

  const handleChannelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as keyof typeof ChannelType;
    setChannelType(ChannelType[value]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col items-center justify-center w-full h-full p-4 space-y-4 '
    >
      <input
        type="text"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        placeholder="Channel name"
        required
        className='text-base text-gray-700 placeholder-gray-600 border rounded-lg w-[150px] pl-1 lg:w-[300px] md:w-[200px]'
      />
      <select value={ChannelType[channelType]} onChange={handleChannelTypeChange} className='text-base text-gray-700 placeholder-gray-600 border rounded-lg pl-1 w-[150px]'>
        <option value="PUBLIC">Public</option>
        <option value="PRIVATE">Private</option>
        <option value="PROTECTED">Protected</option>
      </select>
      {channelType === ChannelType.PROTECTED && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className='text-base text-gray-700 placeholder-gray-600 border rounded-lg w-[150px] pl-1'
        />
      )}
      <div className='flex gap-2'>
        <button className={`${css.Button}`} type="submit">Create</button>
        <button className={`${css.Button}`} onClick={() => setShow(false)}>Back</button>
      </div>
    </form>
  );
};

export default ChannelForm;
