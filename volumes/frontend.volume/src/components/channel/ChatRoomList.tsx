'use client';
import css from "../../styles/ChatRoomList.module.css";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useRef, useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useNavRef } from "../../context/navContext";
import ChannelForm from "./ChannelForm";
import { createChannel, GetPublicChannel, ChannelType } from "../../services/ApiServiceDto";
import ApiService from "../../services/ApiService";

const ChatRoomList = () => {
  const {
    chatRoomRef, chatRoomRect, chatButtonRect, clientBaseUrl,
    addChannel
  } = useNavRef();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const dragHandleRef = useRef(null);
  const [chatRooms, setChatRooms] = useState<GetPublicChannel[]>([]);
  const apiService = new ApiService(clientBaseUrl);
  const [password, setPassword] = useState('');
  const [selectedProtectedRoom, setSelectedProtectedRoom] = useState<GetPublicChannel | null>();

  const updatePosition = () => {
    if (chatRoomRef.current) {
      const newX = window.innerWidth * 0.08;
      const newY = window.innerHeight * 0.22;

      gsap.set(chatRoomRef.current, { x: newX, y: newY });
    }
  };

  useEffect(() => {
    if (!chatRoomRect) {
      gsap.set(chatRoomRef.current, { x: '50vw', y: '50vh' });
    } else {
      gsap.set(chatRoomRef.current, { x: chatButtonRect!.x - chatRoomRect.width / 2, y: chatButtonRect?.y });
    }
    gsap.to(chatRoomRef.current,
      {
        x: chatRoomRect ? chatRoomRect.x : '8vw',
        y: chatRoomRect ? chatRoomRect?.y : '22vh',
        duration: 0.3,
        scale: 1,
        ease: "power2.out"
      });

    gsap.registerPlugin(Draggable);

    Draggable.create(chatRoomRef.current, {
      type: "x,y",
      bounds: window,
      edgeResistance: 0.5,
      trigger: dragHandleRef.current,
    });

    apiService.getPublicChannels().then((data) => {
      setChatRooms(data);
    });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  useEffect(() => {
    apiService.getPublicChannels().then((data) => {
      setChatRooms(data);
    });
  }, [addChannel]);

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

  const handleCreateChannel = (channelData: createChannel) => {
    apiService.createChannel(channelData).then((data) => {
      if (!data.error)
        console.log(data);
    });
    setShowCreateRoom(false);
  };

  const joinRoom = async (room: GetPublicChannel) => {
    if (room.type.toString() === "PROTECTED") {
      setSelectedProtectedRoom(room);
    } else {
      setSelectedProtectedRoom(null);
      await apiService.joinChannel(room.id.toString(), null);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProtectedRoom) {
      await apiService.joinChannel(selectedProtectedRoom.id.toString(), password);

      setSelectedProtectedRoom(null);
      setPassword('');
    }
  };

  return (
    <div className={`${css.Box}`} ref={chatRoomRef}>
      <div className={`${css.Title}`} ref={dragHandleRef}>
        <h3 >IRC Lobby</h3>
      </div>
      {
        showCreateRoom ? (
          <ChannelForm onCreateChannel={handleCreateChannel} setShow={setShowCreateRoom}/>
        ) : (
          <>
            <div className={`${css.Container}`}>
              {chatRooms.map((room) => (
                <div className={`${css.RoomList}`} key={room.id}>
                  <h3 className={`${css.RoomTitle}`}>{room.name}</h3>
                  <p className={`${css.Type}`}>{room.type}</p>
                  <button className={`${css.Button}`} onClick={() => joinRoom(room)}>Join Room</button>
                </div>
              ))}
            </div>
            <div className="">
              {selectedProtectedRoom && (
                <form onSubmit={handlePasswordSubmit}>
                  <input
                    type="password"
                    value={password}  
                    onChange={handlePasswordChange}
                    placeholder="Enter Room Password"
                    required
                    className="m-2 lg:m-2 h-4"
                  />
                  <button className={`${css.Button}`} type="submit">Join</button>
                </form>
              )}
            </div>
            <div className="m-2 lg:m-2 lg:text-xl ">
              <button
                className={`${css.Button}`}
                onClick={handleCreateRoom}
              >
                Create Room
              </button>
            </div>
          </>
        )
      }
    </div>
  );
}

export default ChatRoomList;
