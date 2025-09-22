"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, MapPinIcon, VideoIcon, UsersIcon, PlusIcon, EditIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  maxAttendees?: number;
  createdBy: string;
  createdAt: string;
  creator: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    maxAttendees: ""
  });
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          location: "",
          isVirtual: false,
          maxAttendees: ""
        });
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar evento");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Erro ao criar evento");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by auth hook
  }

  return (
    <MainLayout requireAuth={true}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Calendário de Eventos</h1>
          {user.isAdmin && (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Criar Evento
            </Button>
          )}
        </div>

        {showCreateForm && user.isAdmin && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-primary">Criar Novo Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-foreground">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime" className="text-foreground">Data e Hora de Início</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-foreground">Data e Hora de Término</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAttendees" className="text-foreground">Máximo de Participantes (opcional)</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      value={formData.maxAttendees}
                      onChange={(e) => setFormData({...formData, maxAttendees: e.target.value})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-input border-border text-foreground"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-foreground">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-input border-border text-foreground"
                    placeholder="Deixe em branco para evento virtual"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={formData.isVirtual}
                    onChange={(e) => setFormData({...formData, isVirtual: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isVirtual" className="text-foreground">Evento Virtual</Label>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Criar Evento
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum evento agendado</h3>
              <p className="text-muted-foreground">
                {user.isAdmin ? "Crie seu primeiro evento para a comunidade!" : "Volte em breve para conferir os próximos eventos."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-primary">{event.title}</h3>
                        {event.isVirtual && (
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            <VideoIcon className="h-3 w-3 mr-1" />
                            Virtual
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(event.startTime)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center space-x-2 text-foreground">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.maxAttendees && (
                          <div className="flex items-center space-x-2 text-foreground">
                            <UsersIcon className="h-4 w-4" />
                            <span>Máximo de {event.maxAttendees} participantes</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={event.creator.avatar} />
                            <AvatarFallback className="text-xs">
                              {event.creator.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>Criado por {event.creator.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    {user.isAdmin && (
                      <Button variant="outline" size="sm">
                        <EditIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}