import { baseApi, socket } from "./baseApi";
import { IMessage } from "../../models/IMessage";

export const MESSAGES_URL = "/messages";

export interface AddMessageDto {
  content: string;
  roomId: number;
}

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<IMessage[], number>({
      query: (roomId) => ({ url: MESSAGES_URL, params: { roomId } }),
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        try {
          await cacheDataLoaded;
          socket.connect();
          socket.on("message", (data: IMessage) => {
            updateCachedData((draft) => {
              draft.push(data);
            });
          });
        } catch (error) {
          console.log(error);
        }
        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),
    addMessage: builder.mutation<null, AddMessageDto>({
      queryFn: (data) => {
        if (socket.disconnected) {
          socket.connect();
        }
        socket.emit("message", data);
        return { data: null };
      },
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messageApi;