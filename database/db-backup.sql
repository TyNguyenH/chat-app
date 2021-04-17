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
-- Name: fileinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fileinfo (
    fileid bigint NOT NULL,
    filepath text NOT NULL,
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
    messagetext text NOT NULL,
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
-- Data for Name: fileinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fileinfo (fileid, filepath, filetype) FROM stdin;
\.


--
-- Data for Name: friendship; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendship (userid1, userid2, friendstatus, actionuserid) FROM stdin;
45	34	request	45
45	28	friend	45
45	33	friend	45
32	45	friend	32
27	45	request	27
31	34	friend	31
28	30	friend	28
27	30	friend	27
30	31	friend	30
31	27	friend	31
27	28	friend	27
28	31	friend	28
31	32	friend	31
28	32	request	28
32	27	request	32
33	32	request	33
33	27	request	33
34	30	request	34
33	28	request	33
31	33	request	31
34	27	request	34
44	45	friend	44
\.


--
-- Data for Name: groupinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groupinfo (groupid, groupname, createdate, isactive) FROM stdin;
\.


--
-- Data for Name: messageinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messageinfo (messageid, creatorid, messagetext, fileid, createdate) FROM stdin;
154	28	yeah yeah	\N	2021-04-16 16:01:19+07
155	28	uh huh??	\N	2021-04-16 16:02:43+07
10	28	For real??	\N	2021-04-04 17:15:15+07
11	28	Huh??	\N	2021-04-04 17:17:26+07
74	31	sorry, my car engine is dead. It should be fixed by next week	\N	2021-04-08 16:39:11+07
75	30	r u free this weekend?	\N	2021-04-08 21:45:09+07
78	30	heelo!	\N	2021-04-08 21:54:30+07
79	30	Whasup!?	\N	2021-04-08 21:55:34+07
80	27	How 'bout durian?	\N	2021-04-09 16:12:09+07
81	28	idk	\N	2021-04-09 16:20:21+07
30	27	ei yoo	\N	2021-04-06 10:48:56+07
31	31	what ??	\N	2021-04-06 10:49:01+07
32	31	u gud, bro??	\N	2021-04-06 10:50:16+07
33	27	idk, man...	\N	2021-04-06 10:52:41+07
34	31	brooo??	\N	2021-04-06 11:27:03+07
93	27	what u mean "idk"?	\N	2021-04-09 17:03:34+07
101	31	alo1234	\N	2021-04-09 21:50:24+07
102	27	??	\N	2021-04-09 21:50:52+07
112	28	ola!	\N	2021-04-10 15:48:13+07
113	30	o la la !!	\N	2021-04-10 15:49:39+07
114	28	la o la	\N	2021-04-10 15:51:59+07
115	30	la o o la	\N	2021-04-10 15:52:39+07
116	28	well, i kinda like the durian flavor but not much	\N	2021-04-10 16:31:09+07
117	28	let's talk about smth else, . . .	\N	2021-04-10 16:34:58+07
118	28	Do u like guns and stuff like that?	\N	2021-04-10 16:35:24+07
63	32	yo hoo	\N	2021-04-08 15:53:14+07
64	32	Yooo, where u at !!!!!	\N	2021-04-08 15:53:49+07
65	32	HEEEEEEY, BRO!	\N	2021-04-08 15:54:07+07
66	28	alo	\N	2021-04-08 15:56:16+07
67	28	Can u give me a lift, mate?	\N	2021-04-08 15:56:40+07
119	27	Ah, i like the kriss vector, fully equiped	\N	2021-04-10 16:36:50+07
120	28	yeah, that shit is hot, compact, versatile ...	\N	2021-04-10 16:37:25+07
121	28	btw, do u like night vision goggles?	\N	2021-04-10 16:41:48+07
122	27	ah, no, actually i dont know much 'bout them	\N	2021-04-10 16:42:15+07
123	27	do u like semi-auto rifles?	\N	2021-04-10 16:57:55+07
124	28	yeah, i like ar-15 and scar-h	\N	2021-04-10 17:04:14+07
125	27	how 'bout sniper rifles?	\N	2021-04-10 17:05:23+07
126	28	not much, 'cause i'm really bad at playing them in fps games	\N	2021-04-10 17:06:09+07
129	28	What do u think 'bout silencer and suppressor?	\N	2021-04-10 17:17:51+07
130	27	i like the sound of guns with silencer, though silencer doesnt reduce much sound	\N	2021-04-10 17:22:35+07
131	28	well, u r not wrong ...	\N	2021-04-10 17:23:03+07
5	28	I like ice-cream	\N	2021-03-20 16:44:32+07
6	27	I like too	\N	2021-03-20 16:44:36+07
4	27	What kind of food do you like to eat?	\N	2021-03-20 16:25:28+07
7	27	My favorite flavor is chocolate	\N	2021-03-20 16:45:24+07
132	45	Alo 1234 !!	\N	2021-04-11 17:47:27+07
133	44	sup nigga	\N	2021-04-11 17:47:50+07
134	44	reeeeeee	\N	2021-04-11 17:48:13+07
135	45	zeze hehe	\N	2021-04-11 17:48:46+07
136	33	alo 4321!	\N	2021-04-11 18:08:15+07
137	32	bruh	\N	2021-04-11 18:08:17+07
138	44	N	\N	2021-04-11 18:08:33+07
139	33	213ola!@	\N	2021-04-11 18:08:32+07
140	32	ÁDFGHJKLẺTYUIODFGHJKLDFGHJKFGHJKDFGHJK	\N	2021-04-11 18:09:30+07
141	32	!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()_!@#$%^&*()_!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()_	\N	2021-04-11 18:10:02+07
142	27	yeah	\N	2021-04-14 21:25:15+07
143	30	heey!!	\N	2021-04-14 22:26:11+07
144	27	not sure?!	\N	2021-04-14 22:26:33+07
145	28	o la la o	\N	2021-04-15 18:28:59+07
146	28	yeah yeah	\N	2021-04-15 23:06:16+07
147	30	la la la	\N	2021-04-16 11:12:17+07
148	28	la la o o	\N	2021-04-16 11:17:48+07
149	30	@o@	\N	2021-04-16 11:19:05+07
150	28	ha ha	\N	2021-04-16 15:41:31+07
151	28	hehe	\N	2021-04-16 15:43:28+07
152	28	ho ho ho	\N	2021-04-16 15:56:58+07
153	28	hehe	\N	2021-04-16 15:59:58+07
156	28	1234	\N	2021-04-16 16:03:29+07
157	28	4321	\N	2021-04-16 16:13:45+07
158	28	1234	\N	2021-04-16 16:38:10+07
159	28	ha ha	\N	2021-04-16 16:48:07+07
160	28	hahaha	\N	2021-04-16 16:50:04+07
161	28	hehehe	\N	2021-04-16 16:51:40+07
162	28	alo	\N	2021-04-16 16:52:46+07
163	28	aloalo	\N	2021-04-16 17:03:49+07
164	30	what da hell??	\N	2021-04-16 17:48:43+07
165	30	aloola	\N	2021-04-16 17:51:39+07
166	27	aaaa	\N	2021-04-16 17:55:27+07
167	30	bbbb	\N	2021-04-16 17:56:04+07
168	27	cccc	\N	2021-04-16 17:56:28+07
169	30	dddd	\N	2021-04-16 18:01:20+07
170	27	eeee	\N	2021-04-16 18:04:41+07
171	30	ffff	\N	2021-04-16 18:05:51+07
172	27	gggg	\N	2021-04-16 18:07:42+07
173	30	hhhh	\N	2021-04-16 18:08:13+07
175	31	eeeiii	\N	2021-04-16 21:40:46+07
178	34	j v ba??	\N	2021-04-16 21:49:15+07
179	27	ò ó o ò	\N	2021-04-16 21:49:55+07
\.


--
-- Data for Name: messagerecipient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messagerecipient (messageid, recipientid, recipientgroupid, hasread) FROM stdin;
4	28	\N	t
6	28	\N	t
101	27	\N	t
141	45	\N	t
142	28	\N	t
143	27	\N	t
144	30	\N	t
63	31	\N	f
64	31	\N	f
30	31	\N	t
31	27	\N	t
32	27	\N	t
33	31	\N	t
34	27	\N	t
7	28	\N	t
65	31	\N	f
5	27	\N	t
66	31	\N	t
67	31	\N	t
145	30	\N	t
10	27	\N	t
11	27	\N	t
146	27	\N	t
147	28	\N	t
102	31	\N	t
74	28	\N	f
148	30	\N	t
79	31	\N	f
80	28	\N	t
81	27	\N	t
149	28	\N	t
112	30	\N	t
113	28	\N	t
78	28	\N	t
114	30	\N	t
93	28	\N	t
115	28	\N	t
116	27	\N	t
117	27	\N	t
118	27	\N	t
119	28	\N	t
120	27	\N	t
121	27	\N	t
122	28	\N	t
123	28	\N	t
124	27	\N	t
125	28	\N	t
126	27	\N	t
157	30	\N	t
158	30	\N	t
129	27	\N	t
130	28	\N	t
131	27	\N	t
75	27	\N	t
132	44	\N	t
133	45	\N	t
134	45	\N	t
135	44	\N	t
138	45	\N	t
137	45	\N	t
136	45	\N	t
139	45	\N	t
140	45	\N	t
150	30	\N	t
151	30	\N	t
152	30	\N	t
153	30	\N	t
154	30	\N	t
155	30	\N	t
156	30	\N	t
159	30	\N	t
160	30	\N	t
161	30	\N	t
162	30	\N	t
163	30	\N	t
164	28	\N	t
165	27	\N	t
166	30	\N	t
167	27	\N	t
168	30	\N	t
169	27	\N	t
170	30	\N	t
171	27	\N	t
172	30	\N	t
173	27	\N	t
175	34	\N	t
178	31	\N	t
179	31	\N	t
\.


--
-- Data for Name: useraccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.useraccount (userid, email, userpassword) FROM stdin;
30	jimmi@gmail.com	79bc4b08613f14f23b6de998dd0369a70757b6b06896ddf7212190efe0f2f8f6
27	ty@gmail.com	3d8c400a8d25320c39b5e172a4a537ecc017bfd48e8805aed6a019b9673270ab
28	bot@gmail.com	be1df577011f987938779b7c5dab76b2639e8cdb2e1ac9014acb4a2788b78542
31	tri@gmail.com	0621201787023d139a92746ccf25c12d78dd2b05a0f63fb6c65fb0984d746a01
32	khoai@gmail.com	6a278452079c408faa53cc47c9114967f117063f28729fbb6736e1bb9efcd7be
33	cua@gmail.com	946f0f1e02ba9fa2f4697fa415dddb21b8d2c0a7cc01b3f0bfcc6f99d81264af
34	la@gmail.com	c36ffe81e0e7d2c2350e3e8aaa84072880bb70529a5a5158be3bcc170f7f6248
44	minhb1704833@student.ctu.edu.vn	b54736e73de69d7169f357731be10da81095e1cd4b0ab23fea4617345d5f5060
45	tyb1706552@student.ctu.edu.vn	7b8b0266fa33595f56c2f4ff681407b49ac331d5721f988d4ffeb42453c28170
\.


--
-- Data for Name: usergroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usergroup (userid, groupid, joindate, inviterid) FROM stdin;
\.


--
-- Data for Name: userinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userinfo (userid, firstname, lastname, avatar, createdate, isactive, firstnameeng, lastnameeng) FROM stdin;
27	Tỷ	Nguyễn	/avatars/avatar_1613879928528.jpg	2021-02-21	t	Ty	Nguyen
28	Lú	Bọt	/avatars/avatar_1613880807073.jpg	2021-02-21	t	Lu	Bot
30	jimmi	ngủyên	/avatars/avatar_1614163561199.png	2021-02-24	t	jimmi	nguyen
31	Trí	Trần	/avatars/avatar_1614853312661.jpg	2021-03-04	t	Tri	Tran
33	Cua	Ngang	/avatars/avatar_1616408439257.jpg	2021-03-22	t	Cua	Ngang
34	Lá	Cành Thị	/avatars/avatar_1616661249041.jpg	2021-03-25	t	La	Canh Thi
32	Gian	Khoai	/avatars/avatar_1616060535623.png	2021-03-18	t	Gian	Khoai
44	Tử Minh	Khưu	/avatars/avatar_1618137650214.jpg	2021-04-11	t	Tu Minh	Khuu
45	Tỷ Đô	Joe	/avatars/avatar_1618137649981.jpg	2021-04-11	t	Ty Do	Joe
\.


--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fileinfo_fileid_seq', 1, true);


--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groupinfo_groupid_seq', 1, false);


--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messageinfo_messageid_seq', 179, true);


--
-- Name: useraccount_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.useraccount_userid_seq', 45, true);


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

