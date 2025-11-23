import express from 'express';
import authenticationRouter from './core/authentication/authentication.router.js';
import forumRouter from './core/forum/forum.router.js';
import threads from './core/threads/threads.router.js';
import kategoriRouter from './core/kategori/kategori.router.js';
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
    },
    {
        path : '/kategori',
        route: kategoriRouter
    }

]

routeLists.forEach((route) => {
    router.use(route.path, route.route);
  });
  
  export default router;