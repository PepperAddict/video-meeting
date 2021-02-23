import { configureStore } from '@reduxjs/toolkit'
import {theUser} from './states'

export default configureStore({
    reducer: {
        user: theUser.reducer
    }
})