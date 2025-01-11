import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text.trim() === "") return;

    let imgUrl = null;
    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];
      for (const id of userIDs) {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (chatIndex >= 0) {
            userChatsData.chats[chatIndex].lastMessage = text;
            userChatsData.chats[chatIndex].isSeen =
              id === currentUser.id ? true : false;
            userChatsData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setImg({ file: null, url: "" });
      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>{user?.status || "Active now"}</p>
          </div>
        </div>
        {/*<div className="icons">
          <img src="./phone.png" alt="phone" />
          <img src="./video.png" alt="video" />
          <img src="./info.png" alt="info" />
        </div>*/}
      </div>

      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message.createdAt?.toString()}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="attachment" />}
              <p>{message.text}</p>
              <span>
                {message.createdAt
                  ? format(message.createdAt.toDate())
                  : "Just now"}
              </span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="preview" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
         {/* <label htmlFor="file">
            <img src="./img.png" alt="upload" />
          </label>*/}
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="emoji"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
