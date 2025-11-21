import express from 'express';
import authenticationRouter from './core/authentication/authentication.router.js';
import forumRouter from './core/forum/forum.router.js';
import threads from './core/forum/forum.router.js';
const router = express.Router();


export const routeLists = [
    {
        path : '/auth',
        route: authenticationRouter
    },
    {
        path : '/forum',
        route: forumRouter
    },
    {
        path : '/threads',
        route: threads
    }

]

routeLists.forEach((route) => {
    router.use(route.path, route.route);
  });
  
  export default router;