"use client";
import css from "../../styles/NavBar.module.css";
import UserButton from "./UserButton";
import LogoutButton from "./LogoutButton";
import ChatButton from "./ChatButton";
import FriendButton from "./FriendButton";
import ChannelList from "../../components/navBar/ChannelList";
import { Socket } from "socket.io-client";

const NavBar = ({socket}: {socket: Socket | undefined}) => {
  return (
    <div className={css.Container} >
      <nav className={css.NavBar}>
        <div className={css.LeftAligned}>
          <ChannelList />
        </div>
        <div className={css.CenteredButton}>
          <UserButton />
          <FriendButton />
          <ChatButton />
          <LogoutButton socket={socket}/>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
