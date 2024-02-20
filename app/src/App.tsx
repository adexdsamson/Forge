import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useForge, Forger } from "../../dist";

type FormValues = {
  testOne: string;
};

function App() {
  const { ForgeForm } = useForge<FormValues>({
    fieldProps: [
      {
        name: "testOne",
        component: "input",
      },
    ],
  });

  const onSign = (values: FormValues) => {
    console.log(values);
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <ForgeForm onSubmit={onSign}>
        {/* <input name="test0ne" /> */}
        {/* <Forger name="testOne" component="input" /> */}
        <button type="submit">submit</button>
      </ForgeForm>
    </>
  );
}

export default App;
