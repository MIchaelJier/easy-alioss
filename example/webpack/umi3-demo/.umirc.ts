import { defineConfig } from "umi";
const WebpackAliOSSPlugin = require('@easy-alioss/webpack-plugin')

export default defineConfig({
  routes: [
    { 
      path: "/",
      component: "../layouts",  
      routes: [
        {
          path: '/',
          redirect: '/home',
        },
         { path: "/home", component: "index" },
         { path: "/docs", component: "docs" },
      ]
    }
  ],
  webpack5: false,
  chainWebpack(config) {
    config.plugin('webpack-alioss-plugin').use(WebpackAliOSSPlugin)
  }
});
