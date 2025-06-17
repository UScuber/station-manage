import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../auth";

const Login = () => {
  const [showPass, setShowPass] = useState(false);
  const handleClickShowPass = () => setShowPass((show) => !show);
  const [helperText, setHelperText] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLFormElement | null>(null);
  const passRef = useRef<HTMLFormElement | null>(null);
  const [emailHelperText, setEmailHelperText] = useState("");
  const [passHelperText, setPassHelperText] = useState("");

  const navigation = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const loginMutation = login((authorized) => {
    if (authorized) {
      navigation("/", {
        state: { message: "ログインに成功しました", url: "/" },
        replace: true,
      });
    } else {
      setHelperText("ログインに失敗しました");
    }
    setLoading(false);
  });

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailRef.current || !passRef.current) return;

    let count = 0;

    const email = emailRef.current.value;
    if (
      /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/.test(
        email
      )
    ) {
      setEmailHelperText("");
      count++;
    } else if (email === "")
      setEmailHelperText("メールアドレスを入力してください");
    else setEmailHelperText("正しいメールアドレスを入力してください");

    const pass = passRef.current.value;
    if (pass === "") setPassHelperText("パスワードを入力してください");
    else if (pass.length < 8 || pass.length > 1024)
      setPassHelperText("パスワードは8文字以上1024文字以内です");
    else if (
      !/[a-zA-Z0-9!;:@'"\+\{\}\[\]~\|\^\-=\(\)_\?\.,<>#\$%&`\*]+/.test(pass)
    )
      setEmailHelperText("使用できるのは英大小文字、半角数字、記号のみです");
    else {
      setPassHelperText("");
      count++;
    }

    // submit
    if (count === 2) {
      setLoading(true);
      loginMutation.mutate({
        userName: "",
        userEmail: email,
        password: pass,
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigation("/");
    }
  }, [isAuthenticated]);

  return (
    <Container sx={{ textAlign: "center" }}>
      <Typography variant="h4">Login</Typography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />

      <form onSubmit={onSubmitForm}>
        <FormControl variant="standard" error={!!helperText}>
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
                    tabIndex={-1}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 2.5 }}
          >
            {loading ? (
              <CircularProgress color="inherit" size={30} />
            ) : (
              <Typography variant="h6" sx={{ fontSize: 18 }}>
                Log in
              </Typography>
            )}
          </Button>
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      </form>
    </Container>
  );
};

export default Login;
