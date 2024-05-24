import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Button, Container, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";


const Signin = () => {
  const [showPass, setShowPass] = useState(false);
  const handleClickShowPass = () => setShowPass(show => !show);

  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <Container>
      <Typography variant="h5">サインイン</Typography>
      <form onSubmit={onSubmitForm}>
        <FormControl error={error} variant="standard" required>
          <TextField label="Username" variant="outlined" margin="dense" size="small" required />
          <TextField
            label="Email"
            variant="outlined"
            margin="dense"
            size="small"
            type="email"
            required
          />
        </FormControl>
        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
          <InputLabel htmlFor="password">Password</InputLabel>
          <OutlinedInput
            id="password"
            label="Password"
            margin="dense"
            size="small"
            type={showPass ? "text" : "password"}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPass}
                  edge="end"
                >
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            required
          />
        </FormControl>
        <FormHelperText>{helperText}</FormHelperText>
        <Button type="submit" variant="outlined" sx={{ mt: 1 }}>送信</Button>
      </form>
    </Container>
  );
};

export default Signin;
