import axios from "axios";


axios.defaults.baseURL = import.meta.env.VITE_API_BASEURL;
axios.defaults.withCredentials = true;

// 日付をDate型に変換する
axios.interceptors.response.use(res => {
  const dateFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  for(const key of Object.keys(res.data)){
    const value = res.data[key];
    if(typeof value === "string" && dateFormat.test(value)){
      res.data[key] = new Date(value);
      continue;
    }
    if(value === null){
      res.data[key] = undefined;
      continue;
    }
    if(typeof value === "object"){
      for(const k of Object.keys(value)){
        const val = value[k];
        if(typeof val === "string" && dateFormat.test(val)){
          res.data[key][k] = new Date(val);
        }
      }
    }
  }
  return res;
});

export default axios;
