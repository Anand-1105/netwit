import React, { useContext, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiCalendar } from "react-icons/fi";
import ForgetPasswordDialog from "../Components/ForgetPasswordDialog";
import SetPasswordDialog from "../Components/SetPasswordDialog";

const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().required("Required").min(8, "Min 8 characters"),
});

const SignIn = () => {
    const { login, loading } = useContext(UserContext);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const [forgetOpen, setForgetOpen] = useState(params.get("forget") === "1");
    const [setPasswordOpen, setSetPasswordOpen] = useState(!!params.get("email"));
    const emailParam = params.get("email") || "";

    React.useEffect(() => {
        setForgetOpen(params.get("forget") === "1");
        setSetPasswordOpen(!!params.get("email"));
    }, [location.search]);

    const handleOpenForget = (e) => {
        e.preventDefault();
        params.set("forget", "1");
        navigate({ search: params.toString() }, { replace: true });
    };

    const handleCloseForget = () => {
        params.delete("forget");
        navigate({ search: params.toString() }, { replace: true });
    };

    const handleForgetSuccess = (email) => {
        params.delete("forget");
        params.set("email", email);
        navigate({ search: params.toString() }, { replace: true });
    };

    const handleCloseSetPassword = () => {
        params.delete("email");
        navigate({ search: params.toString() }, { replace: true });
    };

    const handleLogin = async (data) => {
        try {
            await login(data);
            navigate("/app");
        } catch {
            setErrorMessage("Invalid email or password");
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4">
            <ForgetPasswordDialog open={forgetOpen} onClose={handleCloseForget} onSuccess={handleForgetSuccess} />
            <SetPasswordDialog open={setPasswordOpen} email={emailParam} onClose={handleCloseSetPassword} />

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-10">
                <span className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
                    <FiCalendar size={14} className="text-black" />
                </span>
                <span className="text-white font-bold tracking-tight">MeetApp</span>
            </Link>

            {/* Card */}
            <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
                <h1 className="text-lg font-bold text-white mb-1">Sign in</h1>
                <p className="text-white/40 text-sm mb-7">Enter your credentials to continue</p>

                <Formik
                    initialValues={{ email: "", password: "" }}
                    validationSchema={validationSchema}
                    onSubmit={({ email, password }) => handleLogin({ email: email.toLowerCase(), password })}
                >
                    {({ isSubmitting }) => (
                        <Form className="space-y-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Email</label>
                                <Field
                                    name="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                                <ErrorMessage name="email" component="p" className="text-red-400 text-xs mt-1" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs text-white/50">Password</label>
                                    <button type="button" onClick={handleOpenForget}
                                        className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                                <Field
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                                <ErrorMessage name="password" component="p" className="text-red-400 text-xs mt-1" />
                            </div>

                            {errorMessage && (
                                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || loading}
                                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 text-black text-sm font-semibold py-2.5 rounded-md transition-colors mt-2"
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>

            <p className="text-white/20 text-xs mt-6">India CIO Summit · Conference Room Booking</p>
            <p className="text-white/30 text-xs mt-2">
                No account?{' '}
                <Link to="/signup" className="text-amber-500 hover:text-amber-400 transition-colors">
                    Create one
                </Link>
            </p>
        </div>
    );
};

export default SignIn;
