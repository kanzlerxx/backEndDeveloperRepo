import express from 'express';
import authenticationRouter from './core/authentication/authentication.router.js';
import forumRouter from './core/forum/forum.router.js';
import threads from './core/threads/threads.router.js';
import kategoriRouter from './core/kategori/kategori.router.js';
import usersRouter from './core/users/users.router.js';
import comments from './core/comments/comments.router.js';
import bookmarklistRouter from './core/bookmarklist/bookmarklist.router.js';
import bookmarkcontentRouter from './core/bookmark_content/bookmark_content.router.js';
import reportRouter from './core/report/report.router.js';
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
    },
    {
        path : '/users',
        route: usersRouter
    },
    {
        path : '/comments',
        route: comments
    },
    {
        path : '/bookmarklist',
        route: bookmarklistRouter
    },
    {
        path : '/bookmarkcontent',
        route: bookmarkcontentRouter
    },
    {
        path : '/report',
        route: reportRouter
    },


]

routeLists.forEach((route) => {
    router.use(route.path, route.route);
  });
  
  export default router;