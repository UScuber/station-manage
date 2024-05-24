import {
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FormEvent, useRef, useState } from "react";
import { useAuth } from "../auth/auth";
import { useNavigate } from "react-router-dom";


const Signin = () => {
  const [showPass, setShowPass] = useState(false);
  const handleClickShowPass = () => setShowPass(show => !show);
  const [helperText, setHelperText] = useState("");
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<HTMLFormElement | null>(null);
  const emailRef = useRef<HTMLFormElement | null>(null);
  const passRef = useRef<HTMLFormElement | null>(null);
  const [nameHelperText, setNameHelperText] = useState("");
  const [emailHelperText, setEmailHelperText] = useState("");
  const [passHelperText, setPassHelperText] = useState("");

  const navigation = useNavigate();
  const { signin } = useAuth();
  const signinMutation = signin(
    (authorized) => {
      if(authorized){
        navigation("/");
      }else{
        setHelperText("サインインに失敗しました");
      }
      setLoading(false);
    }
  );

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!emailRef.current || !nameRef.current || !passRef.current) return;

    const name = nameRef.current.value;
    if(name === "") setNameHelperText("ユーザー名を入力してください");
    else setNameHelperText("");

    const email = emailRef.current.value;
    if(/^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/.test(email)){
      setEmailHelperText("");
    }else if(email === "") setEmailHelperText("メールアドレスを入力してください");
    else setEmailHelperText("正しいメールアドレスを入力してください");

    const pass = passRef.current.value;
    if(pass === "") setPassHelperText("パスワードを入力してください");
    else if(pass.length < 8 || pass.length > 1024) setPassHelperText("パスワードは8文字以上1024文字以内です");
    else if(!/[a-zA-Z0-9!;:@'"\+\{\}\[\]~\|\^\-=\(\)_\?\.,<>#\$%&`\*]+/.test(pass)) setEmailHelperText("使用できるのは英大小文字、半角数字、記号のみです");
    else setPassHelperText("");

    if(!nameHelperText && !emailHelperText && !passHelperText){
      setLoading(true);
      signinMutation.mutate({
        userName: name,
        userEmail: email,
        password: pass,
      });
    }
  };

  return (
    <Container sx={{ textAlign: "center" }}>
      <Typography variant="h4">Signin</Typography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />

      <form onSubmit={onSubmitForm}>
        <FormControl variant="standard" error={!!helperText}>
          <TextField
            id="username"
            label="Username"
            variant="outlined"
            margin="none"
            type="text"
            inputRef={nameRef}
            helperText={nameHelperText || " "}
            error={!!nameHelperText}
          />
          <TextField
            id="email"
            label="Email"
            variant="outlined"
            // type="email"
            inputRef={emailRef}
            helperText={emailHelperText || " "}
            error={!!emailHelperText}
          />
          <TextField
            id="password"
            label="Password"
            autoComplete="password"
            type={showPass ? "text" : "password"}
            inputRef={passRef}
            helperText={passHelperText || " "}
            error={!!passHelperText}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPass}
                    edge="end"
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 2.5 }}
          >
            {loading ?
              <CircularProgress color="inherit" size={30}/>
              :
              <Typography variant="h6" sx={{ fontSize: 18 }}>Sign in</Typography>
            }
          </Button>
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      </form>
    </Container>
  );
};

export default Signin;
