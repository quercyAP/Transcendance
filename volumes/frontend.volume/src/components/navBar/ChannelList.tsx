import React from "react";
import css from "../../styles/NavBar.module.css";
import { gsap } from "gsap";
import { useRef, useState, useEffect } from "react";
import { useNavRef } from "../../context/navContext";
import ApiService from "../../services/ApiService";
import { GetPrivateChannel } from "../../services/ApiServiceDto";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const ChannelList = () => {
  const [activeImgRef, setActiveImgRef] = useState<React.RefObject<unknown>>();
  const [ownerAvatars, setOwnerAvatars] = useState<(string | undefined)[]>([]);
  const [activeChannelId, setActiveChannelId] = useState(0);
  const [stopBlinkingFunctions, setStopBlinkingFunctions] = useState<{ [channelId: number]: (() => void) | undefined }>({});
  const {
    chatComponentRef, setShowChatComponent,
    showChatComponent, toggleMenu, setActiveChannel, activeChannel, clientBaseUrl,
    addChannel, blinkingChannelId, channels, setChannels, localChannels

  } = useNavRef();
  const imgRefs = useRef<any[]>([]);
  const apiService = new ApiService(clientBaseUrl);

  const handleAvatarClick = (channel: GetPrivateChannel, imgRef: React.RefObject<HTMLImageElement>) => {
    if (activeImgRef && activeImgRef.current) {
      inactiveBorder(activeImgRef);
    }
    stopBlinkingFunctions[channel.id]?.();
    setActiveImgRef(imgRef)
    activeBorder(imgRef);
    gsap.fromTo(imgRef.current,
      { scale: 0.8 },
      {
        scale: 1,
        duration: 0.5,
        ease: "bounce.out"
      });
    if (chatComponentRef.current && channel === activeChannel) {
      inactiveBorder(activeImgRef);
      toggleMenu({ ref: chatComponentRef, dispatch: setShowChatComponent, show: showChatComponent });
    } else {
      setActiveChannel(channel);
      setActiveChannelId(channel.id);
      setShowChatComponent(true);
    }
  }

  const blinkingBorder = (imgRef: React.RefObject<HTMLImageElement>, channelId: number) => {
    const blink = () => {
      activeBorder(imgRef);
      setTimeout(() => {
        inactiveBorder(imgRef);
      }, 200);  
    };

    blink();

    const intervalId = setInterval(blink, 400);

    return () => {
      clearInterval(intervalId);
      setStopBlinkingFunctions(prev => {
        const newStopBlinkingFunctions = { ...prev };
        delete newStopBlinkingFunctions[channelId];
        return newStopBlinkingFunctions;
      });
    };
  };

  useEffect(() => {
    if (blinkingChannelId && blinkingChannelId !== activeChannelId) {
      const index = channels.findIndex(channel => channel.id === blinkingChannelId);
      if (index !== -1 && imgRefs.current[index]) {
        const stopBlinking = blinkingBorder(imgRefs.current[index], blinkingChannelId);
        setStopBlinkingFunctions(prev => ({ ...prev, [blinkingChannelId]: stopBlinking }));
      }
    }
  }, [blinkingChannelId]);

  const findOwnerAvatar = async (channel: GetPrivateChannel) => {
    for (const user of channel.users) {
      if (user.roles) {
        let avatar;
        if (!user?.avatarUrl || user?.avatarUrl.includes("null")) {
          avatar = user.avatar42Url;
        } else {
          avatar = user?.avatarUrl;
        }
        return avatar;
      }
    }
  };

  const activeBorder = (imgRef: React.RefObject<HTMLImageElement>) => {
    gsap.to(imgRef.current, {
      duration: 0.2,
      ease: "power1.in",
      borderColor: "#aefcff",
      borderWidth: "2px",
      borderStyle: "solid",
      boxShadow: "0 0 5px #aefcff",
    });
  };

  const inactiveBorder = (imgRef: React.RefObject<HTMLImageElement> | any) => {
    gsap.to(imgRef.current, {
      duration: 0.2,
      ease: "power1.out",
      borderColor: "transparent",
      borderWidth: "2px",
      borderStyle: "solid",
      boxShadow: "none"
    });
  };

  useEffect(() => {
    const fetchChannels = async () => {
      const data = await apiService.getMyChannels();
      const findChannel = data.find(channel => channel.id === activeChannelId);
      if (!findChannel) {
        toggleMenu({ ref: chatComponentRef, dispatch: setShowChatComponent, show: showChatComponent });
      }
      setChannels([...data, ...localChannels]);
    };

    fetchChannels();
  }, [addChannel]);

  useEffect(() => {
    const loadOwnerAvatars = async () => {
      const avatars = await Promise.all(channels.map(channel => findOwnerAvatar(channel)));
      setOwnerAvatars(avatars);
    };
    setActiveChannel((prevChannel: any) => {
      if (prevChannel) {
        const channel = channels.find(channel => channel.id === prevChannel.id);
        if (!channel) {
          return prevChannel;
        }
        return channel;
      }
      return prevChannel;
    });

    loadOwnerAvatars();
  }, [activeImgRef, channels]);

  return (
    <>
      {channels.length > 0 && (
        <div className={css.ScrollableImageList}>
          <Swiper
            modules={[Mousewheel]}
            spaceBetween={0}
            slidesPerView={5}
            mousewheel={true}
            pagination={{ clickable: true }}
          >
            {channels.map((channel, index) => {
              if (!imgRefs.current[index]) {
                imgRefs.current[index] = React.createRef<any>();
              }
              return (
                <SwiperSlide key={channel.id} className={css.ImageItem}>
                  <img
                    ref={imgRefs.current[index]}
                    src={ownerAvatars[index]}
                    alt={`Avatar of ${channel.name}`}
                    onClick={() => handleAvatarClick(channel, imgRefs.current[index])}
                    className="rounded cursor-pointer border-2 border-transparent hover:border-[#aefcff]"
                    onMouseEnter={() => channel.id !== activeChannelId && activeBorder(imgRefs.current[index])}
                    onMouseLeave={() => channel.id !== activeChannelId && inactiveBorder(imgRefs.current[index])}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}
    </>
  );
};

export default ChannelList;
