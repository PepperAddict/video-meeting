import { configureStore } from '@reduxjs/toolkit'
import {theRoom, theUser} from './states'

export default configureStore({
    reducer: {
        user: theUser.reducer,
        room: theRoom.reducer
    }
})