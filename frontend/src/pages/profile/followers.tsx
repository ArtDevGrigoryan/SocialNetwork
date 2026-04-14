import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/axios.config";

const Followers = () => {
  const { id } = useParams();
  const [followers, setFollowers] = useState<any[]>([]);
  const fetchFollowers = async (id: string) => {
    const { data } = await api.get(`/friends/followers`);
  };
  useEffect(() => {}, [id]);
};
