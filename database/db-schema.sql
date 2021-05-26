--
-- PostgreSQL database dump
--

-- Dumped from database version 11.10
-- Dumped by pg_dump version 11.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: convertvntoeng(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.convertvntoeng(chars text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
 withTone text; noTone text; res text;
BEGIN
 withTone = 'áàảãạâấầẩẫậăắằẳẵặđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ';
 noTone = 'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY';
 res = chars;
 FOR i IN 0..length(withTone)
 LOOP
 res = replace(res, substr(withTone, i, 1), substr(noTone, i, 1));
 END LOOP;
 RETURN res;
END;
$$;


ALTER FUNCTION public.convertvntoeng(chars text) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: accountregistrationrequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accountregistrationrequest (
    requestid bigint NOT NULL,
    email character varying(128) NOT NULL,
    requestpassword character varying(128) NOT NULL,
    firstname character varying(20) NOT NULL,
    lastname character varying(20) NOT NULL,
    requesttime timestamp with time zone NOT NULL,
    avatar text NOT NULL
);


ALTER TABLE public.accountregistrationrequest OWNER TO postgres;

--
-- Name: accountregistrationrequest_requestid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accountregistrationrequest_requestid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accountregistrationrequest_requestid_seq OWNER TO postgres;

--
-- Name: accountregistrationrequest_requestid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accountregistrationrequest_requestid_seq OWNED BY public.accountregistrationrequest.requestid;


--
-- Name: adminaccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adminaccount (
    adminid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    adminname character varying(128) NOT NULL,
    adminpassword character varying(128) NOT NULL
);


ALTER TABLE public.adminaccount OWNER TO postgres;

--
-- Name: fileinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fileinfo (
    fileid bigint NOT NULL,
    filepath text,
    filetype character varying(10) NOT NULL
);


ALTER TABLE public.fileinfo OWNER TO postgres;

--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fileinfo_fileid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fileinfo_fileid_seq OWNER TO postgres;

--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fileinfo_fileid_seq OWNED BY public.fileinfo.fileid;


--
-- Name: friendship; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendship (
    userid1 integer NOT NULL,
    userid2 integer NOT NULL,
    friendstatus character varying(12) NOT NULL,
    actionuserid integer NOT NULL,
    CONSTRAINT friendship_check CHECK ((userid2 <> userid1))
);


ALTER TABLE public.friendship OWNER TO postgres;

--
-- Name: groupinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groupinfo (
    groupid bigint NOT NULL,
    groupname character varying(30) NOT NULL,
    createdate date NOT NULL,
    isactive boolean NOT NULL
);


ALTER TABLE public.groupinfo OWNER TO postgres;

--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groupinfo_groupid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groupinfo_groupid_seq OWNER TO postgres;

--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groupinfo_groupid_seq OWNED BY public.groupinfo.groupid;


--
-- Name: messageinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messageinfo (
    messageid bigint NOT NULL,
    creatorid integer NOT NULL,
    messagetext text,
    fileid integer,
    createdate timestamp with time zone NOT NULL
);


ALTER TABLE public.messageinfo OWNER TO postgres;

--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messageinfo_messageid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messageinfo_messageid_seq OWNER TO postgres;

--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messageinfo_messageid_seq OWNED BY public.messageinfo.messageid;


--
-- Name: messagerecipient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messagerecipient (
    messageid bigint NOT NULL,
    recipientid bigint NOT NULL,
    recipientgroupid bigint,
    hasread boolean NOT NULL
);


ALTER TABLE public.messagerecipient OWNER TO postgres;

--
-- Name: useraccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.useraccount (
    userid bigint NOT NULL,
    email character varying(128) NOT NULL,
    userpassword character varying(128) NOT NULL
);


ALTER TABLE public.useraccount OWNER TO postgres;

--
-- Name: useraccount_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.useraccount_userid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.useraccount_userid_seq OWNER TO postgres;

--
-- Name: useraccount_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.useraccount_userid_seq OWNED BY public.useraccount.userid;


--
-- Name: usergroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usergroup (
    userid integer NOT NULL,
    groupid integer NOT NULL,
    joindate date NOT NULL,
    inviterid integer NOT NULL,
    CONSTRAINT usergroup_check CHECK ((inviterid <> userid))
);


ALTER TABLE public.usergroup OWNER TO postgres;

--
-- Name: userinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userinfo (
    userid integer NOT NULL,
    firstname character varying(20) NOT NULL,
    lastname character varying(20) NOT NULL,
    avatar text,
    createdate date NOT NULL,
    isactive boolean NOT NULL,
    firstnameeng character varying(20),
    lastnameeng character varying(20)
);


ALTER TABLE public.userinfo OWNER TO postgres;

--
-- Name: accountregistrationrequest requestid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountregistrationrequest ALTER COLUMN requestid SET DEFAULT nextval('public.accountregistrationrequest_requestid_seq'::regclass);


--
-- Name: fileinfo fileid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fileinfo ALTER COLUMN fileid SET DEFAULT nextval('public.fileinfo_fileid_seq'::regclass);


--
-- Name: groupinfo groupid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groupinfo ALTER COLUMN groupid SET DEFAULT nextval('public.groupinfo_groupid_seq'::regclass);


--
-- Name: messageinfo messageid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo ALTER COLUMN messageid SET DEFAULT nextval('public.messageinfo_messageid_seq'::regclass);


--
-- Name: useraccount userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount ALTER COLUMN userid SET DEFAULT nextval('public.useraccount_userid_seq'::regclass);


--
-- Name: accountregistrationrequest accountregistrationrequest_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountregistrationrequest
    ADD CONSTRAINT accountregistrationrequest_email_key UNIQUE (email);


--
-- Name: accountregistrationrequest accountregistrationrequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountregistrationrequest
    ADD CONSTRAINT accountregistrationrequest_pkey PRIMARY KEY (requestid);


--
-- Name: adminaccount adminaccount_adminname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adminaccount
    ADD CONSTRAINT adminaccount_adminname_key UNIQUE (adminname);


--
-- Name: adminaccount adminaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adminaccount
    ADD CONSTRAINT adminaccount_pkey PRIMARY KEY (adminid);


--
-- Name: fileinfo fileinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fileinfo
    ADD CONSTRAINT fileinfo_pkey PRIMARY KEY (fileid);


--
-- Name: groupinfo groupinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groupinfo
    ADD CONSTRAINT groupinfo_pkey PRIMARY KEY (groupid);


--
-- Name: messageinfo messageinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_pkey PRIMARY KEY (messageid);


--
-- Name: useraccount useraccount_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount
    ADD CONSTRAINT useraccount_email_key UNIQUE (email);


--
-- Name: useraccount useraccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount
    ADD CONSTRAINT useraccount_pkey PRIMARY KEY (userid);


--
-- Name: usergroup usergroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_pkey PRIMARY KEY (userid, groupid);


--
-- Name: friendship friendship_actionuserid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_actionuserid_fkey FOREIGN KEY (actionuserid) REFERENCES public.useraccount(userid);


--
-- Name: friendship friendship_userid1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_userid1_fkey FOREIGN KEY (userid1) REFERENCES public.useraccount(userid);


--
-- Name: friendship friendship_userid2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_userid2_fkey FOREIGN KEY (userid2) REFERENCES public.useraccount(userid);


--
-- Name: messageinfo messageinfo_creatorid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_creatorid_fkey FOREIGN KEY (creatorid) REFERENCES public.useraccount(userid);


--
-- Name: messageinfo messageinfo_fileid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_fileid_fkey FOREIGN KEY (fileid) REFERENCES public.fileinfo(fileid);


--
-- Name: messagerecipient messagerecipient_messageid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_messageid_fkey FOREIGN KEY (messageid) REFERENCES public.messageinfo(messageid);


--
-- Name: messagerecipient messagerecipient_recipientgroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_recipientgroupid_fkey FOREIGN KEY (recipientgroupid) REFERENCES public.groupinfo(groupid);


--
-- Name: messagerecipient messagerecipient_recipientid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_recipientid_fkey FOREIGN KEY (recipientid) REFERENCES public.useraccount(userid);


--
-- Name: usergroup usergroup_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_groupid_fkey FOREIGN KEY (groupid) REFERENCES public.groupinfo(groupid);


--
-- Name: usergroup usergroup_inviterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_inviterid_fkey FOREIGN KEY (inviterid) REFERENCES public.useraccount(userid);


--
-- Name: usergroup usergroup_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_userid_fkey FOREIGN KEY (userid) REFERENCES public.useraccount(userid);


--
-- Name: userinfo userinfo_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userinfo
    ADD CONSTRAINT userinfo_userid_fkey FOREIGN KEY (userid) REFERENCES public.useraccount(userid);


--
-- PostgreSQL database dump complete
--

