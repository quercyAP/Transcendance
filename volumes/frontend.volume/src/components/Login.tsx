import css from "../styles/Login.module.css";

const Login = ({ redirectUri }: { redirectUri: string }) => {
  const redirectTo42OAuth = () => {
    const clientId = process.env.API42_CLIENT_ID;
    const responseType = "code";
    const scope = "public";
    const oauthUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=${responseType}&scope=${scope}`;
    window.location.href = oauthUrl;
  };

  const redirectToGithubOAuth = () => {
    const clientId = process.env.API_GITHUB_CLIENT_ID;
    const scope = "read:user";
    const serviceParam = "service=github";
    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri + `?${serviceParam}`,
    )}&scope=${scope}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className={`${css.Container}`}>
      <div className={`${css.Box}`}>
        <button className={`${css.Button}`} onClick={redirectTo42OAuth}>
          Login with 42
        </button>
        <button className={`${css.Button}`} onClick={redirectToGithubOAuth}>
          Login with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
